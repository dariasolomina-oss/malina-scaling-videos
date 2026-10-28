# LakeSentry: локальный CLI до video review

`engine/scripts/pipeline.py` связывает существующие `episode.py`, `prepare_page.py`,
`timings.py`, offline `voice_elevenlabs.py` и `engine/render/render.js`.
Граница scope — локальный `media/video.mp4` со статусом `review`, **не публикация**.
Внешнее media storage и агент не подключены. CLI не делает TTS/API-запросов,
не пишет в git, не создаёт настоящий git branch, не публикует сайт/видео.

Нужны Python >=3.10, Node с установленными зависимостями renderer/Playwright и
браузером; для аудио и MP4 — `ffmpeg`/`ffprobe` в PATH. Работать из корня repo.
Один writer на эпизод, без параллельного редактирования во время build/render.

## Silent draft → review → final60

```sh
python3 engine/scripts/pipeline.py init --episode episodes/demo --id demo \
  --brand brands/lakesentry --format horizontal --duration 8 --voice none \
  --author 'Author' --thread-url 'https://example.org/thread'
# Для 9:16: --format vertical (1080x1920 вместо 1920x1080).
# Человек редактирует script.md и content.json; init оставляет FR-заглушки.
python3 engine/scripts/episode.py status episodes/demo
# Следующая команда — ТОЛЬКО после реального явного решения человека:
python3 engine/scripts/episode.py approve episodes/demo script --human 'Проверяющий' --confirm
python3 engine/scripts/pipeline.py build --episode episodes/demo
python3 engine/scripts/pipeline.py render --episode episodes/demo \
  --fps 30 --chunk-frames 240 --resume
# Человек смотрит media/video.mp4 и принимает отдельное решение:
python3 engine/scripts/episode.py approve episodes/demo video --human 'Проверяющий' --confirm
python3 engine/scripts/pipeline.py render --episode episodes/demo --final60 \
  --chunk-frames 240 --resume
```

CLI **не вызывает approve** и не подставляет approvals от имени автора.
`init` записывает FR `metadata` (author/thread_url), локальный descriptor `branch`
(language/format/name), настройки `pipeline` в единственный `episode.yaml`.
Это JSON-compatible YAML, не второй state file. Сценарий живёт в `script.md`;
изменения и revision обрабатывает модуль episode. Descriptor branch — не git ref.

`content.json` принимает только безопасную схему universal templates: headline,
subtitle, footer, до трёх blocks {title, body}, demo, duration. Duration должен
совпадать с настройкой эпизода. HTML из данных не исполняется; данные внедряет
`prepare_page.safe_json`. Шаблоны и локальные JS — доверенный код, не sandbox.
Демонстрационный контент не выдаётся за настоящий UI или доказанные результаты.

`build` требует актуальный script approval **до Node CSS subprocess и записи
source/work**. Сохраняет self-contained `source/index.html`, `brand.json`,
`content.json`, копию script.md, исходный universal template и локальные assets.
Текст source пригоден для version control. Бинарные assets, MP3/MP4, work cache
покрываются существующим `.gitignore` для стандартного `episodes/<id>/` layout;
для произвольного PATH вне этого layout политику исключения work задаёт оператор.
CLI сам ничего не добавляет в git. Не храните предоставленный connector response
с base64-аудио в version control.

## Что именно защищают guards

До production-побочных эффектов вызывается `episode.require_production`.
Исключение: сам `episode.load` может записать state, снимая устаревшие approvals,
как предусмотрено его контрактом. Пустой/изменённый/неодобренный сценарий
блокирует build, voice и render до Node/FFprobe. Сценарий должен быть действительно
согласован человеком, не только заполнен заглушкой.

Build binding в `episode.yaml` фиксирует script hash/revision, настройки, hashes
content/audio/timings, всего brand directory и используемых engine JS/Python.
Отдельно фиксируются все файлы source. Render пересчитывает binding и source hashes
до subprocess и после завершения: изменение production inputs требует rebuild;
смена script требует нового script approval. Build не создаёт approvals.

**Это prompt/workflow approval, не криптографическое согласование всех данных.**
Существующий human approval подписывает только script hash/revision. Content/brand
можно изменить и явно запустить новый build в рамках согласованного сценария;
такой rebuild снимает video approval. Не утверждаем, что человек независимо одобрил
каждый новый content/brand hash. Отдельного `bind-content`/content approval нет.
Если редактура выходит за согласованный сценарий, сначала измените script.md и
заново получите реальное human approval. Локальные state files доверенные;
ручное редактирование, прямой запуск Node и другие scripts могут обойти CLI.
Нет IAM, подписи, защиты от злонамеренного оператора или конкурентных writers.

## MP3 и уже готовые words

При `init --voice mp3` вместо `none` после script approval:

```sh
python3 engine/scripts/pipeline.py voice --episode episodes/demo \
  --mp3 /path/approved-voice.mp3 --timings /path/words.json
python3 engine/scripts/pipeline.py build --episode episodes/demo
python3 engine/scripts/pipeline.py render --episode episodes/demo --fps 30 --resume
```

Импорт проверяет реальный MP3 codec/container и положительную длительность через
FFprobe, сохраняет `inputs/voiceover.mp3` и нормализованный `timings.json`.
Только существующие words: массив или `{ "words": [{"text":"Hello","start":0,"end":0.4}] }`.
Timings обязательны, конечны, упорядочены, без overlap, в пределах аудио и видео.
Транскрипции, alignment API, интерполяции segment timestamps нет. Точность слов
не подтверждена машиной, соответствие голосу и сценарию проверяет человек.

## ElevenLabs — только supplied connector response

Для эпизода `--voice elevenlabs` после script approval:

```sh
python3 engine/scripts/pipeline.py voice --episode episodes/demo \
  --response /private/provided-response.json --authorized-connector-response
```

Используется существующий offline parser: `audio_base64` плюс `alignment` или
`normalized_alignment` с characters/character_start_times_seconds/
character_end_times_seconds. Данные должны быть реально предоставлены через
авторизованный процесс; CLI их не получает сам. Parser работает в изолированной
временной копии эпизода; аудио проверяется FFprobe, преобразуется в
`inputs/voiceover.mp3`, timings сохраняются отдельно. Нет ключей, сети, вызова
ElevenLabs или подключённого connector в этом репозитории.

## Render, ошибки, аудио и повторный review

Node получает HTML, отдельный рабочий cache directory и `--video`, `--fps 30|60`,
`--chunk-frames N`, опциональный `--resume`; размеры задаются W/H, HTML_ROOT и
RENDER_CACHE_KEY фиксированы. Cache key зависит от production binding/source,
fps и chunk size разделяют каталоги. Возобновление сохраняет готовые chunks;
ошибки Node/FFmpeg не маскируются и ненулевой код возвращается CLI.
Неудачный render не заменяет предыдущее `media/video.mp4`.

Выход готовится под уникальным version filename, затем атомарно заменяет
`media/video.mp4`; только после этого state становится `review`. История содержит
input/video hashes и fps. File replace и state write не являются общей транзакцией:
после аварии между ними нужно повторно загрузить state/сделать review.

`none` намеренно выдаёт **silent output**, без events.json mix в этом CLI.
К тишине требование −14 LUFS неприменимо: loudness не измеряется и не заявляется.
В voice modes FFmpeg добавляет audio с apad и loudnorm target −14 LUFS/−1 dBTP,
AAC; это однопроходная обработка, не сертификат измеренного integrated loudness.
Captions/word-driven animation автоматически не добавляются: timings сохраняются
как обязательный проверяемый production input, а не обещание burned-in subtitles.

Draft 30 fps всегда заканчивается review. `--final60` (или `--fps 60`) разрешён
только после настоящего video approval текущего draft с тем же build hash.
Изменение approved video bytes уже снимает approval через `episode.load`, возвращая
review. Новый 60 fps файл **не наследует approval** draft: pipeline также явно
снимает video approval и ставит review, даже если encoder случайно выдал те же
байты. Нужно заново посмотреть и одобрить новый файл через `episode.py approve`.
Переходы publish_ready/published и публикация не входят в CLI.

## Проверка

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_pipeline.py' -v
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v
```

Тесты проверяют guards до subprocess, init, оба self-contained формата,
инвалидацию script/content/source/brand/config/audio, ошибки Node, draft/final
approval и offline импорт. MP3/renamed WAV/битое аудио проверяются реальными
FFmpeg/FFprobe. Отдельный audio integration test реально mux-ит аудио, но Node
подменён маленьким FFmpeg video fixture. **Ни один mock Node test не является
доказательством реального browser render**. Для настоящего browser E2E запустите
команды выше с установленным Playwright, реальными approvals и визуальным review;
эта автоматическая проверка такого результата не заявляет.
