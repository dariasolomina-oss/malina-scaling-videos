# Local font sources

Downloaded over HTTPS using Python urllib.request on 2026-10-28. URLs are Google Fonts repository files (main, not a pinned revision). Original font filenames retained; each family has its downloaded OFL.txt. See individual licenses for copyright and reserved names. No license text invented.

- `Outfit[wght].ttf` (110884 bytes): https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf
  License: https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt
- `PlusJakartaSans[wght].ttf` (176288 bytes): https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf
  License: https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/OFL.txt
- `JetBrainsMono[wght].ttf` (187208 bytes): https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf
  License: https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/OFL.txt
- `Montserrat[wght].ttf` (744936 bytes): https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf
  License: https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt
- `Montserrat-Italic[wght].ttf` (762376 bytes): https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat-Italic%5Bwght%5D.ttf
  License: https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt

## Integrity at download

SHA-256 of the downloaded files (not signatures or a provenance guarantee):

```text
48715a42ec242c21e9f02692891e147d022299a52e48d5e413e1a942193ffeda  JetBrainsMono[wght].ttf
51607f316bc020e59f03cbf51543eecffbea501c0b31d73e5b82927c5cca442c  Montserrat-Italic[wght].ttf
0f7b311b2f3279e4eef9b2f968bcdbab6e28f4daeb1f049f4f278a902bcd82f7  Montserrat[wght].ttf
fc7287273e66929776e2ba54f144fe699080bec29f61bf649d70d871468aeade  Outfit[wght].ttf
89b3fb38aa0d275d7a731d0d817a4f1622b316b4d7fbdedcf02ee9099ff68bc8  PlusJakartaSans[wght].ttf
b2fe5e8987594e9ffd1d2ca52a2f5d73eb8335243893c5d6254b5ad69269591d  jetbrainsmono-OFL.txt
8b7141c03fa4f8d44e6345d5d4931709290f0f67875e452e95ac1fd3a027802e  montserrat-OFL.txt
c676351bf8576b9aba743cd5eaa8c0e7ee0d51f805d720447b4df4ddb6a2e416  outfit-OFL.txt
995c7199cab65954f545996326755daee7b63cc6b42b06c13da1f9502ab08a99  plusjakartasans-OFL.txt
```

Variable weight bounds inspected from the downloaded fonts’ `fvar` tables with fontTools: Outfit 100–900; Plus Jakarta Sans 200–800; JetBrains Mono 100–800; Montserrat (normal and italic) 100–900.
