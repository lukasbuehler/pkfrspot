# PKFR Spot

- Web: [pkfrspot.com](https://pkfrspot.com)

## Roadmap

## Collaborating

To collaborate on the code of this project, you will need to create a pull-request on GitHub. To get started you should for this repository, and
after making your changes, create a pull-request with your changes.

### Translation

The translation files are in [`src/locales`](./src/locale/) and
English (`en`) is the source language.

To tweak a translation simply go to the corresponding file, find what you want to change, and change the value inside the `target` XML tag only. Example:

```xml
<xliff version="2.0" xmlns="urn:oasis:names:tc:xliff:document:2.0" srcLang="en" trgLang="de-CH">
    <file id="ngi18n" original="ng.template">
        <unit id="1940752772695642659">
            <segment state="initial">
                <source> The spot for Parkour and Freerunning. </source>
                <target> De Spot für Parkour und Freerunning. </target>
            </segment>
        </unit>
        ...
    </file>
</xliff>
```

#### Update the language files

After adding new text in the markup and adding the i18n attribute, the language files will need to be updated to include this new text source.

Run the following command:

```
ng extract-i18n
```

After that the language files will be updated (and possibly reformatted, which is ok). You can now edit the language files as usual with the new text.

#### Adding a new language

1. Find the language code and country for the language you want to add.
   If it is a country specific language variant it should be of the form `xx-XX`, where the latter part is the country code.
   If it is not country specific, the language code is simply of the form `xx`.
   Check out the list of language codes on [Wikipedia](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) and see Set 1. Also, for country specific languages, check out this site: [Country Code Language List](https://www.fincher.org/Utilities/CountryLanguageList.shtml).

2. With the code, add the language in [`angular.json`](./angular.json). Add it as a locale inside `i18n > locales`, and the language code inside the `architect > build > options > localize` JSON

```json
{
  ...
  "projects": {
    "pkfrspot": {
      ...
      "i18n": {
        ...
        "locales": {
          ...
          "de": {
            "translation": "src/locale/messages.de.xlf",
            "baseHref": "/de/"
          },
          "de-CH": {
            "translation": "src/locale/messages.de-CH.xlf",
            "baseHref": "/de-CH/"
          }
          ...

          // add your new language here
          // with its language code xx-XX or xx similar to above...

          // "xx-XX": {
          //   "translation": "src/locale/messages.xx-XX.xlf",
          //   "baseHref": "/xx-XX/"
          // }
        }
        ...
      },
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "localize": ["en", "de", "de-CH", "xx-XX"], // add you language here too
            ...
          }
          ...
        }
        ...
      }
      ...
    }
  }
}
```

3. Copy an existing language file like `messages.de.xlf` in `src/locale` and paste it with the same name as in [`angular.json`](./angular.json), e.g. `messages.xx-XX.xlf` or `messages.xx.xlf`.
4. Edit this new language file in [`src/locales`](./src/locale/).
5. Update the [src/proxy-server.mjs](./src/proxy-server.mjs) file to include the new language in the `supportedLanguages` array at the very top.

```mjs
const supportedLanguages = ["en", "de", "de-CH", "xx-XX"]; // here
...
```

6. Submit a pull-request with your changes on [GitHub](https://github.com/lukasbuehler/pkfrspot/compare)

### Developing Locally

1. Generate your own Google API key
2. Enter it in `keys.development.ts`
3. Build for the development environment when developing locally

#### Build

```
npm run build
```

#### Test Angular frontend (watch for changes)

```
npm run dev
```

#### Testing Angular SSR

```
npm run build
npm run serve:ssr
```

<!-- #### Testing Firebase

```
firebase experiments:enable webframeworks
```

```
firebase emulators:start
```

#### Testing container build

Using gcloud CLI, you can test the deployment to Google Cloud.
First you need to authenticate us

```
gcloud beta code dev
``` -->
