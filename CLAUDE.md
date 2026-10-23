# Ambient Mixer

## Обзор проекта

Статический SPA-микшер фоновых звуков (дождь, гроза, костёр, трасса, лес, поезд, пляж, метель) с громкостью на каждый звук, Focus-таймером (Помодоро), Sleep-таймером и анимированным glassmorphism-интерфейсом. Языки интерфейса: RU / EN. Бэкенда нет.

**Стек:** Vite 8 · React 19 · TypeScript (strict) · Tailwind CSS 4 (`@tailwindcss/vite`) · lucide-react · Web Audio API · Vitest + Testing Library (jsdom). Деплой: Vercel (автодеплой с `main`), заголовки в `vercel.json` и `public/_headers`.

Подробный дизайн и обоснование решений — [project-design.md](project-design.md) (на русском; местами устарел — приоритет у кода). Лицензии звуков — в [README.md](README.md).

## Архитектура

```
src/
  main.tsx, App.tsx          # провайдеры: ErrorBoundary → AppProvider → EngineProvider
  audio/engine.ts            # класс AudioEngine — вся работа с Web Audio, без React
  audio/EngineContext.tsx    # зеркалит state → engine через useEffect; статусы загрузки через useSyncExternalStore
  state/types.ts             # AppState, Action
  state/reducer.ts           # чистый reducer, LIMITS, DEFAULT_FOCUS, sanitizeFocus, clamp
  state/storage.ts           # localStorage: toPersisted / mergePersisted (валидация), ключ 'ambient-mixer:v1'
  state/AppContext.tsx       # useApp(), useT(); сохранение с debounce 300 мс
  timers/focus.ts, sleep.ts  # чистые функции (время передаётся аргументом `now`)
  timers/use*Timer.ts        # React-обёртки над чистой логикой (setInterval 250 мс)
  data/sounds.ts             # SOUND_IDS, SOUNDS (иконка, цвет, файл, credit)
  i18n/en.ts, ru.ts          # словари; тип Dict = typeof en
  components/                # UI; SoundScene.tsx — CSS-анимации под каждый звук
  __tests__/                 # engine / focus / state / ui
public/audio/*.m4a           # зацикленные AAC-лупы
scripts/synth-ambience.mjs   # генератор синтетической метели (WAV)
```

Ключевые принципы:
- **UI не знает про Web Audio.** Компоненты вызывают методы движка (`engine.retry(id)`) или шлют `dispatch`; движок получает состояние только через эффекты в `EngineContext.tsx`.
- **Состояние — `useReducer` + контекст**, без Redux/Zustand. Любое новое поле: `types.ts` → `reducer.ts` → (если сохраняется) `storage.ts`.
- **Таймеры = чистая логика + тонкий хук.** Состояние (`FocusRun`) иммутабельно, функции принимают `now: number` — это делает их тестируемыми без fake timers.

## Команды

```bash
npm install
npm run dev        # http://localhost:5173 (конфиг превью: .claude/launch.json, имя "ambient-mixer")
npm test           # vitest run (один прогон)
npx vitest src/__tests__/focus.test.ts   # один файл
npm run build      # tsc -b && vite build → dist/
npm run preview    # предпросмотр сборки
```

Линтера и форматтера нет — ориентируйся на окружающий код. Типы проверяются в `npm run build` (`noUnusedLocals`/`noUnusedParameters` включены, неиспользуемые переменные ломают сборку).

## Тестирование

- Vitest с `globals: true` (но тесты всё равно явно импортируют `describe, expect, it` из `vitest`), окружение `jsdom`, setup — `src/test-setup.ts` (`jest-dom`).
- Тесты лежат в `src/__tests__/`, импорты относительные (`'../audio/engine'`).
- **Web Audio в jsdom нет.** Движок тестируется через фабрику `createContext` и `fetcher` в конструкторе `AudioEngine`: подставляется `fakeContext()` с `vi.fn()`-узлами (см. `engine.test.ts`). Не мокай глобальный `AudioContext` в тестах движка.
- UI-тест (`ui.test.tsx`) подставляет `window.AudioContext = class {}` и пишет язык в `localStorage` до `render(<App />)`; запросы по ролям с `hidden: true`, т.к. часть дерева скрыта.
- Логику таймеров тестируй как чистые функции с явным `now` (`MIN = 60_000`, `DEFAULT_FOCUS`).
- После правок логики: `npm test`; после правок типов/компонентов — `npm run build`.

## Стиль кода

- TypeScript strict, ESM, без точек с запятой, одинарные кавычки, отступ 2 пробела, trailing commas в многострочных литералах.
- **Именованные экспорты** везде, кроме `App` (`export default`). Файлы компонентов — `PascalCase.tsx`, остальные — `camelCase.ts`.
- `import type { … }` для типов; тип в смешанном импорте — `import { SOUND_IDS, type SoundId } from …`.
- Union-строки вместо enum: `type TimerMode = 'off' | 'focus' | 'sleep'`; списки значений — `as const` (`SOUND_IDS`).
- Компоненты — функции с деструктуризацией пропсов в сигнатуре; без `React.FC`.
- Стили: Tailwind-утилиты в `className` + собственные классы в `src/index.css` (`.glass`, `.glass-btn`, `.btn-primary`, `.sound-card`, `.scene-*`). Цвета — через CSS-переменные (`var(--accent)`, `var(--fg-soft)`), темы — через `[data-bg='sunset']` / `.bg-*`. Цвет карточки звука передаётся как `style={{ '--sc': sound.color }}`.
- Любая новая анимация сопровождается блоком `@media (prefers-reduced-motion: reduce)` (так сделано для всех существующих).
- Иконки — только `lucide-react`; всегда `aria-hidden="true"` на декоративных, `aria-label`/`role` на интерактивных (`role="switch"`, `role="tab"`, `role="timer"`).
- Комментарии — на английском, короткие и только про «почему» (`// turning something on while paused should be audible`). JSDoc `/** */` — для полей и публичных методов с неочевидным контрактом.
- Пользовательский текст не хардкодится: ключ в `i18n/en.ts` **и** `i18n/ru.ts`, использование через `const t = useT()`. Тип `Dict` заставит добавить оба.

## Подводные камни

- **`AudioContext` создаётся только синхронно в обработчике клика «Start session»** (`engine.init()`), иначе браузеры блокируют автовоспроизведение. Не переноси `init()` в `useEffect` или после `await`.
- **Пауза = `gate`-GainNode в 0, а не `ctx.suspend()`**, чтобы сигнал таймера (chime, синтезируется осцилляторами) звучал при паузе. Не заменяй на suspend.
- **Выход проходит через `MediaStreamDestination` → `<audio>`** + Media Session, чтобы мобильные браузеры не замораживали звук при блокировке экрана; при отказе есть фолбэк на прямой вывод. iOS может оставить контекст в `interrupted` — поэтому `resumeIfNeeded()` на `pointerdown` и `visibilitychange`.
- **Громкости сохраняются, `enabled` — нет:** каждая сессия стартует в тишине (`mergePersisted` принудительно ставит `enabled: false`). Это осознанное решение.
- **`localStorage` — ненадёжный вход:** всё читается через `mergePersisted` с проверкой типов и `clamp`; новые поля обязаны валидироваться там же. Менять формат несовместимо — повышай версию ключа `ambient-mixer:v1`. Все обращения к `localStorage`/`navigator` обёрнуты в try/catch.
- **Лимиты настроек** живут в `LIMITS` (reducer.ts); значения Focus прогоняются через `sanitizeFocus`, Sleep — `clamp(1..720)`. Не дублируй числа в компонентах.
- **Звуки:** имена файлов в `public/audio/` без хеша, кеш — 1 день. При замене записи **используй новое имя файла** и обнови `file`/`credit` в `data/sounds.ts`. Атрибуция (CC BY / CC BY-SA) обязательна и показывается в `Credits.tsx`; обновляй и таблицу в README.
- **Новый звук:** добавь id в `SOUND_IDS`, запись в `SOUNDS`, переводы в `sounds` обоих словарей, анимацию в `SoundScene.tsx`, файл в `public/audio/` (AAC `.m4a`, бесшовный луп, выровненная громкость; метель генерирует `node scripts/synth-ambience.mjs <outdir>`, затем `afconvert x.wav x.m4a -d aac -f m4af -b 96000`).
- **CSP строгая** (`vercel.json`, `public/_headers`): `default-src 'self'`, `connect-src 'self'`, `media-src 'self' blob:`. Внешние шрифты, CDN, аналитика и `fetch` на чужие домены будут заблокированы — при необходимости меняй оба файла синхронно.
- `README.md` содержит два раздела `## Deploy` (дубль) — при правках README объединяй, а не добавляй третий.
- `.env.local`, `.vercel/`, `dist/`, `*.tsbuildinfo` — в `.gitignore`; не коммить и не читай секреты из `.env.local`.
- Git: коммиты короткие, в повелительном/описательном стиле на английском, без префиксов (`Sleep timer: custom minutes field can be cleared and retyped`); деплой происходит при пуше в `main`.
