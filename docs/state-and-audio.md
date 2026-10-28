# MVP S2: состояние, approvals, локальные версии и аудио

Python >=3.10, только stdlib; `requirements-s2.txt` не требует установки пакетов.
Все команды запускаются из корня репозитория. `episode.yaml` содержит JSON —
допустимое подмножество YAML. Обычный YAML с отступами этим CLI не читается.
Схемы и ограничения: [schemas](../schemas/README.md).

## Создание и жизненный цикл

```sh
python3 engine/scripts/episode.py create episodes/demo --id demo --title 'LakeSentry demo' --language en
# Человек/редактор заполняет episodes/demo/script.md (UTF-8).
python3 engine/scripts/episode.py status episodes/demo
python3 engine/scripts/script_check.py episodes/demo/script.md --max-words 180
# ТОЛЬКО после реального явного решения человека, не агентом от его имени:
python3 engine/scripts/episode.py approve episodes/demo script --human 'Имя проверяющего' --confirm
python3 engine/scripts/episode.py transition episodes/demo voice
# Авторизованный connector response предоставляется отдельно, не генерируется этим CLI.
python3 engine/scripts/voice_elevenlabs.py episodes/demo /path/to/connector-response.json --authorized-connector-response
python3 engine/scripts/episode.py transition episodes/demo render
# Отдельный guarded renderer создаёт episodes/demo/media/video.mp4.
python3 engine/scripts/episode.py transition episodes/demo review
# Человек действительно смотрит видео и принимает решение:
python3 engine/scripts/episode.py approve episodes/demo video --human 'Имя проверяющего' --confirm
python3 engine/scripts/episode.py transition episodes/demo publish_ready
# После реальной внешней публикации, не вместо публикации:
python3 engine/scripts/episode.py transition episodes/demo published
```

Строгая последовательность:
`topic → script → script_approved → voice → render → review → video_approved → publish_ready → published`.
`*_approved` устанавливается только `approve`, не `transition`. Изменение байтов
сценария обнаруживается на следующем обращении, увеличивает revision, снимает оба
approval и возвращает `script`. Approval хранит hash сценария, revision, имя,
явное подтверждение и UTC-время. Изменение/удаление видео снимает video approval,
возвращает `review`, блокирует package. Пустые сценарий/видео нельзя одобрить.
`status` поэтому может обновить состояние; это не read-only операция.

Имя + `--confirm` — локальная запись аттестации, **не проверка личности**. Нельзя
придумывать approvals или подставлять имя человека без его решения. Файлы состояния
доверенные локальные: ручное редактирование может обходить workflow. Подписей, IAM,
блокировок и защиты от конкурентной записи в MVP нет: один writer на эпизод,
никаких параллельных edits во время production операции.

`transition` меняет состояние, но не вызывает TTS, renderer, packager или upload.
Production интеграция обязана вызвать `episode.require_production(path, 'voice'|'render'|'package')`
**до побочного эффекта**. Без script approval voice/render запрещены; package
требует также video approval. Offline voice parser уже использует guard.
Существующие shell/Node render-команды сами по себе этим Python-модулем не
перехватываются: без интеграции guard их нельзя считать безопасным production path.
`publish_ready` означает допуск к упаковке; не наличие готового архива.

## Изолированные временные каталоги

`episode.work_dir(path)` создаёт уникальный `episodes/<id>/work/run-*` для каждого
запуска. Вызывающий удаляет его в `finally`; voice parser делает это сам.
Временные данные не попадают в snapshots. Постоянные media лежат в `media/`.

## Локальное media storage и восстановление

```sh
python3 engine/scripts/episode.py version episodes/demo --storage /path/to/local-s2-storage
# Команда вернёт UUID версии. Восстановление только в НОВУЮ директорию:
python3 engine/scripts/episode.py restore episodes/demo-restored --storage /path/to/local-s2-storage --version UUID_ИЗ_ПРЕДЫДУЩЕЙ_КОМАНДЫ
```

`LocalDirectoryStorage.version/restore` — тестовый файловый адаптер, **внешнее
хранилище не подключено**. Episode и storage не должны пересекаться. Версия включает
весь persistent текст и media, manifest с SHA-256 и размерами. Все пути и checksums
проверяются до записи; symlink, absolute/`..`/backslash paths отклоняются. Restore
не перезаписывает существующую директорию, при ошибке убирает неполный результат.
Версии хранить вне git и вне episode. Успешное восстановление сбрасывает текущие
approvals, увеличивает revision и требует нового human review; исторические записи
остаются только audit trail. Checksum не является подписью и не доказывает авторство.

## Готовые timings и offline ElevenLabs response

```sh
python3 engine/scripts/timings.py words.json episodes/demo/timings.json --source words
python3 engine/scripts/timings.py whisper-verbose.json episodes/demo/timings.json --source whisper
python3 engine/scripts/timings.py connector-response.json episodes/demo/timings.json --source elevenlabs
```

`words`: массив или `{"words":[{"text":"Hello","start":0,"end":0.4}]}`.
Whisper: только уже предоставленный verbose JSON с top-level `words`; `word` вместо
`text` поддерживается. Транскрипция и segment-to-word interpolation не выполняются.
ElevenLabs adapter принимает предоставленные `alignment` или `normalized_alignment`:
`characters`, `character_start_times_seconds`, `character_end_times_seconds`.
Слово определяется whitespace; никакой forced alignment/оценки точности нет.
Конечные числа, положительная длительность слов, отсутствие overlap обязательны.
Результат: `schema_version`, `unit=seconds`, `source`, `accuracy=not_verified`, `words`.
Качество и соответствие реальному аудио проверяются отдельно человеком.

`voice_elevenlabs.py` **не вызывает сеть**, не читает raw keys, не использует apps.
Здесь разрешённой подключённой интеграции нет. Он только импортирует уже полученный
законным разрешённым connector response: `audio_base64` + alignment. Нужны явный
флаг авторизации и актуальный script approval. Base64 и timings валидируются до
записи. Выход `media/voice.audio` имеет нейтральное расширение: codec не угадывается,
валидность/проигрываемость аудиобайта этим parser не доказывается. Коннектор обязан
предоставить формат отдельно; parser не выдаёт тестовые байты за настоящее аудио.

## Проверки

```sh
python3 engine/scripts/doctor.py --path .
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Doctor показывает presence инструментов, Python и disk bytes. CDP — только наличие
одной из переменных `CDP_URL`, `CDP_ENDPOINT`, `BROWSER_CDP_URL`, без её значения;
не запускает браузер, не проверяет соединение и не печатает credentials/env.
Machine script checks: пустота, word budget, placeholders, control characters.
Editorial review всегда `pending`: facts/claims, tone, delivery и rights — не машинный approval.
