PackageDir := "./client-js"
NodeNixDir := "../nix-files/node2nix" # realtive to PackageDir

# Recreate node2nix-generated files
rebuild-node2nix:
    cd {{PackageDir}} && \
    node2nix --nodejs-14 --development \
    --output      {{NodeNixDir}}/node-packages.nix \
    --composition {{NodeNixDir}}/default.nix \
    --node-env    {{NodeNixDir}}/node-env.nix
