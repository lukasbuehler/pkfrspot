# PKFR Spot

- Web: [pkfrspot.com](https://pkfrspot.com)

## Roadmap

## Collaborating

### Translation

The translation files are in `src/locales` and
`en` is the source language.

To tweak a translation go to the corresponding file,

#### Adding a language

#### Updating the language files after adding text

```
ng extract-i18n
```

### Developing Locally

1. Generate your own Google API key
2. Enter it in `keys.development.ts`
3. Build for the development environment when developing locally

#### Build

```
npm run build
```

#### Angular frontend

```
npm run dev
```

#### SSR

```
npm run build
npm run serve:ssr
```

#### Testing firebase

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
```
