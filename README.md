# Currency Converter

This is a simple currency converter inspired by florinpop17's [app-ideas](https://github.com/florinpop17/app-ideas). It's also my first solo svelte project.

## Get started

Install the dependencies...

```bash
cd <git directory>
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see the app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.

If you're using [Visual Studio Code](https://code.visualstudio.com/) it is recommended to install the official extension [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using other editors you may need to install a plugin in order to get syntax highlighting and intellisense.

## Dependencies

I used the standard Svelte dependencies as well as "@rollup/plugin-replace" to handle environmental vaiables.

Conversion data from [currencyconverterapi.com](https://www.currencyconverterapi.com/)
