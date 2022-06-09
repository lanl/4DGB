#
# Nix derivations for Python packages
#
{ python3, zlib, openssl, libpng, pkg-config, stdenv, runCommandLocal, gtk-js }:

let
  gtk-version = builtins.readFile ../server/version.md;
in
with python3.pkgs;
rec {
  # pybbi python package
  pybbi = buildPythonPackage {
    pname = "pybbi";
    version = "0.3.2";
    src = fetchGit {
      url="https://github.com/nvictus/pybbi";
      rev="14eda4facf56ff264e4f5313c9583213990c570e"; # Release v0.3.2
    };
    nativeBuildInputs = [ pkg-config ];
    buildInputs =  [
      # Python packages
      pkgconfig numpy cython pandas
      pytest
      # Libs
      zlib openssl libpng
    ];
    doCheck = false;
  };

  # Python dependencies
  pydeps = [ pybbi flask flask-restful sqlalchemy pandas requests ];

  # Python environment
  venv = python3.withPackages (_: pydeps);

  # gtkserver static files
  gtkserver-static = runCommandLocal "gtkserver-static" {
    gtk = gtk-js; src = ../server/static;
  } ''
    cp -r --no-preserve=mode $src $out
    cp $gtk/gtk.min.js $out/gtk/js
  '';

  # gtkserver.py executable
  gtkserver = runCommandLocal "gtkserver-${gtk-version}" {
    static = gtkserver-static;
    server = ../server/gtkserver.py;
  } ''
    mkdir -p $out/bin
    DEST=$out/bin/gtkserver.py

    # Insert a shebang for gtkserver.py
    echo "#!${venv}/bin/python3" > $DEST
    cat $server >> $DEST
    chmod +x $DEST

    # Copy static files
    cp -rT $static $out/bin/static
  '';

  # db_pop executable
  db_pop = runCommandLocal "db_pop" {
    src = ../bin/db_pop;
  } ''
    mkdir -p $out/bin
    substitute $src $out/bin/db_pop --replace "#!/usr/bin/env python3" "#!${venv}/bin/python3"
    chmod +x $out/bin/db_pop
  '';
}