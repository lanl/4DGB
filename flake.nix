#
# Nix flake for the 4DGB Browser
#
# This provides a development environment with
# necessary dependencies installed and exports several packages
# related to running the browser and preparing data.
#
# The development environment provides:
#   - python3 with required packages installed
#   - NodeJS and a NODE_PATH set to a node_modules folder
#       with required packages installed
#   - Other tools (node2nix, just, etc)
#
# The packages exported by this flake include:
#   - db_pop: Executable of the db_pop script
#   - gtk-js: Minified GTK Javascript library
#   - gtkserver: Executable of GTK Flask server
#   - gtkserver-static: Static files used by gtkserver
#   - nodeDependencies: node_modules contents for NodeJS dependencies
#   - pybbi: Build of pybbi Python package
#   - venv: Python environment with required packages installed
#
# (The GTK client python library is currently not included)
#
# NOTE:
#   NodeJS dependencies are generated using node2nix. If you make any changes
#   to the package.json file, you need to run node2nix again to re-create the
#   necessary files. A recipe is included to do this. Just run
#     'just rebuild-node2nix`
#   to rebuild the node2nix files, then exit and re-enter the development
#   shell.
#
#   Also, webpack is available in the development environment, but it doesn't
#   work without an actual ./node_modules directory. After entering the development
#   environment, you should create a symlink to it by running:
#     'ln -s $NODE_PATH ./node_modules'
#   Just remember to remove it when you're done!
#
{
  description = "Python module for processing Hi-C files through LAMMPS";

  inputs = {
    # Nixpkgs
    nixpkgs.url = "github:NixOS/nixpkgs/release-22.05";

    # Flake-compat library
    # (Used to generate a flake-less nix.shell file)
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };

    # Flake-utils library
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-compat, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        nodePkgs = pkgs.callPackage ./nix-files/node.nix {
          nodeEnv = (import ./nix-files/node2nix { inherit system pkgs; });
        };

        pythonPkgs = pkgs.callPackage ./nix-files/python.nix { inherit (nodePkgs) gtk-js; };

      in rec {
        packages = {
          inherit (nodePkgs) gtk-js nodeDependencies;
          inherit (pythonPkgs) venv pybbi gtkserver db_pop gtkserver-static;
        };

        # Development environment
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [ python3 node2nix nodejs-14_x just ]
            ++ [ nodePkgs.nodeShell] ++ pythonPkgs.pydeps;
          shellHook = nodePkgs.nodeShell.shellHook;
        };
      }
    );
}
