# copic-colors

Up to date list of copic colors extracted from the [official copic website][1].

- `name`: Name of the color.
- `number`: Copic color number.
- `hex`: Official hex code extracted from [the american website][2].
- `fileName`: Cilename of the color-swatch downloaded from the [official copic website][1]. The file are located in the [`images` folder][3].
- `extractedColor`: Dominant color extracted from the color-swatch.

## Build

The build script will download the color swatches from the [official copic website][1] and extract the dominant color from each swatch. (It will take a while to download all the swatches and extract the colors.)

```bash
npm run build
```

[1]: https://copic.jp/en/color/
[2]: https://copic.too.com/blogs/educational/copic-color-system
[3]: /images/
