PackageDir := "./client-js"

# Recreate node2nix-generated files
rebuild-node2nix:
    cd {{PackageDir}} && node2nix --nodejs-14 --development
