# ReactView

ReactView is a framework for building react.js based UIs that can be hosted in Avalonia/WPF applications.

# Sample

Inside the Sample.Avalonia folder you may find a Task List application that showcases most of the functionalities provided by this framework.

# Build pre-requisites
- NodeJS

# ViewPacker

We have a node package, _**node-sass**_ which creates a folder of vendors for each OS. However, to generate these vendors, the following command needs to run in each OS:
Inside ViewPacker with node_modules installed, the user should run `node scripts/install.js` which will generate a new vendor folder inside `node_modules/node_sass/vendor/` for the user's selected OS. This new vendor folder (e.g. `darwin-x64-72/`) and its **binding.node** content file shall then be added to ViewPacker's `build/node-sass-vendors/`.

For now we are using the following node versions:
- 10.16.3
- 12.18.4

**Note:** If you wish to upgrade the node version at use, don't forget to delete/replace any previous bindings related to the OS (`darwin-x64-72/` represents node 12.X.X's version).

# TODO
- Improve documentation
