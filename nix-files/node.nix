#
# Nix derviations for NodeJS stuff
#
{ stdenv, nodejs, nodeEnv, node2nix, writeShellScriptBin }:

let
  nodeDependencies = nodeEnv.nodeDependencies;
  nodeShell = nodeEnv.shell;
in
{
  inherit nodeDependencies nodeShell;

  # Minified gkt.min.js
  gtk-js = stdenv.mkDerivation {
    name = "gtk.min.js";
    src = ../client-js;

    buildInputs = [nodejs];
    buildPhase = ''
      ln -s ${nodeDependencies}/lib/node_modules ./node_modules
      export PATH="${nodeDependencies}/bin:$PATH"
      NODE_ENV=production webpack
    '';
    installPhase = ''
      cp -r gtk-dist $out/
    '';
  };
}