#
# Nix derivations for the 4DGB Browser and its dependencies
#
{ pkgs }:

let
  node = pkgs.nodejs-14_x;

  nodeEnv = import ./client-js { inherit pkgs; nodejs = node; };

  #pybbi python package
  pybbi = {
    python3, pkg-config,
    zlib, openssl, libpng
  }: with python3.pkgs; buildPythonPackage {
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
  pydeps = { python3 }: with python3.pkgs; [
    (pkgs.callPackage pybbi {inherit python3;})
    flask flask-restful sqlalchemy pandas requests
  ];

  # Python environment
  venv = { python3 }: python3.withPackages (_: pydeps {inherit python3;});

  # Minified gtk.min.js
  gtk-js = { stdenv, nodejs }: stdenv.mkDerivation {
    name = "gtk.min.js";
    src = ./client-js;

    buildInputs = [nodejs];
    buildPhase =
    let modules = nodeEnv.nodeDependencies;
    in ''
      ln -s ${modules}/lib/node_modules ./node_modules
      export PATH="${modules}/bin:$PATH"
      NODE_ENV=production webpack
    '';
    installPhase = ''
      cp -r gtk-dist $out/
    '';
  };

  # gtkserver static files
  gtkserver-static = pkgs.runCommandLocal "gtkserver-static" {
    gtk = (pkgs.callPackage gtk-js {nodejs = node;});
    src = ./server/static;
  } ''
    cp -r --no-preserve=mode $src $out
    cp $gtk/gtk.min.js $out/gtk/js
  '';

  # gtkserver.py executable
  gtkserver = { python3 }: pkgs.runCommandLocal "gtkserver" {
    static = gtkserver-static;
    server = ./server/gtkserver.py;
    venv = venv {inherit python3;};
  } ''
    mkdir -p $out/bin
    DEST=$out/bin/gtkserver.py

    # Insert a shebang for gtkserver.py
    echo "#!''${venv}/bin/python3" > $DEST
    cat $server >> $DEST
    chmod +x $DEST

    # Copy static files
    cp -rT $static $out/bin/static
  '';

  # db_pop executable
  db_pop = { python3 }: pkgs.runCommandLocal "db_pop" {
    src = ./bin/db_pop;
    venv = venv {inherit python3;};
  } ''
    mkdir -p $out/bin
    substitute $src $out/bin/db_pop --replace "#!/usr/bin/env python3" "#!''${venv}/bin/python3"
    chmod +x $out/bin/db_pop
  '';

  # Development shell
  devShell = { 
    mkShell, python3,
    nodejs, node2nix, just
  }: with python3.pkgs; mkShell {
    buildInputs = [ python3 node2nix nodejs just nodeEnv.shell ]
      ++ (pydeps {inherit python3;});
    shellHook = nodeEnv.shell.shellHook;
  };
in
{
  gtkserver = pkgs.callPackage gtkserver {};
  db_pop = pkgs.callPackage db_pop {};
  gtk-js = pkgs.callPackage gtk-js { nodejs = node; };
  devShell = pkgs.callPackage devShell { nodejs = node; };
}
