# Requirements and notes

Requires a simple web server to work:

```
python3 -m http.server 8080
```

Also requires *three* module installed in this directory, and a slightly modified *OrbitControls.js* in that module, so that the first import statement imports from the local three.module.js:

```
} from '../../../build/three.module.js';
```

These are temporary and will be removed ...
