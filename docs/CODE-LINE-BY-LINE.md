# DARIN'S HANDMADE — построчный разбор всего кода

В этом документе разобран **каждый файл проекта, каждая функция и каждая строка**. Номера строк совпадают с файлами в репозитории: можно открыть файл в VS Code и идти по нему вместе с документом.

**Как устроен разбор каждого файла:**

- **Что это за файл** — одной-двумя фразами.
- **Кто подключает этот файл** — какие другие файлы делают `require(...)` или `import ... from` на него.
- **Что подключает сам файл** — каждая строка импорта: что берётся и откуда.
- **Каждая функция**: кто её вызывает, что она вызывает сама (с указанием файлов), что получает на вход и что возвращает. Потом код функции и объяснение **каждой строки** по номеру.
- Для больших кусков разметки (JSX — то, что рисуется на экране) объяснение идёт **блоками строк**: «стр. 96–117 — две вкладки Sign In / Create Account». Каждая строка с логикой (условие, обработчик клика, вывод данных) объяснена отдельно.

**Обозначения:** «стр. 12» — строка 12 этого файла. «стр. 12–20» — строки с 12 по 20. «→» — «вызывает» или «переходит в».

---

# Часть 0. Карта: какой файл с каким связан

## 0.1 Сервер (папка back/)

```
index.js  (запуск сервера)
 ├─ db/connect.js                      ← подключение к MongoDB
 ├─ routes/authRoute.js     /api/auth
 │    ├─ controllers/AuthController.js
 │    │    ├─ models/userModel.js
 │    │    └─ utils/email.js
 │    ├─ middleware/validate.js
 │    └─ middleware/authMiddleware.js
 │         └─ models/userModel.js
 ├─ routes/productsRoute.js /api/products
 │    ├─ controllers/ProductController.js
 │    │    └─ models/productModel.js
 │    ├─ middleware/authMiddleware.js
 │    ├─ middleware/roleMiddleware.js
 │    └─ middleware/upload.js
 ├─ routes/cartRoute.js     /api/cart
 │    ├─ controllers/CartController.js
 │    │    └─ models/cartModel.js
 │    └─ middleware/authMiddleware.js
 ├─ routes/ordersRoute.js   /api/orders
 │    ├─ controllers/OrderController.js
 │    │    ├─ models/orderModel.js
 │    │    ├─ models/productModel.js
 │    │    └─ utils/email.js
 │    ├─ middleware/authMiddleware.js
 │    └─ middleware/roleMiddleware.js
 └─ controllers/OrderController.js  (stripeWebhook, /api/orders/webhook)

seed/products.js     ← запускается вручную, сайт его не вызывает
```

## 0.2 Сайт (папка front/)

```
index.html  → src/main.jsx
main.jsx    → App.jsx, index.css, BrowserRouter
App.jsx
 ├─ api.jsx                          ← axios, адрес сервера
 ├─ context/CartContext.jsx          ← корзина для всех страниц (использует api.jsx)
 ├─ shared/ui/Header.jsx             ← шапка (использует CartContext)
 ├─ shared/ui/Footer.jsx             ← подвал
 └─ pages/...                        ← 16 страниц, по одной на адрес
      большинство используют api.jsx (запросы) и/или CartContext (корзина)
```

## 0.3 Какая страница какой адрес сервера вызывает

| Страница (front) | Запрос | Функция на сервере |
|---|---|---|
| `App.jsx` | `GET /api/auth/me` | `protect` → `getMe` |
| `LoginPage` | `POST /api/auth/signin`, `POST /api/auth/signup` | `signin`, `signup` |
| `ForgotPasswordPage` | `POST /api/auth/forgot-password` | `forgotPassword` |
| `ResetPasswordPage` | `POST /api/auth/reset-password` | `resetPassword` |
| `BeadedBagsPage`, `BraceletsPage`, `ManagerProductsPage` | `GET /api/products` | `getAllProducts` |
| `ProductDetailPage` | `GET /api/products/:id` | `getProductById` |
| `ManagerProductsPage` | `POST`, `PUT`, `DELETE /api/products` | `createProduct`, `updateProduct`, `deleteProduct` |
| `CartContext` | `GET`, `POST`, `PATCH`, `DELETE /api/cart` | `getCart`, `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart` |
| `CheckoutPage` | `POST /api/orders/checkout-session` | `createCheckoutSession` |
| `OrderSuccessPage` | `GET /api/orders/by-session/:id` | `getOrderBySession` |
| `ManagerOrdersPage` | `GET /api/orders`, `GET /api/orders/stats`, `PATCH /api/orders/:id/status` | `getAllOrders`, `getStats`, `updateOrderStatus` |
| Stripe (не браузер) | `POST /api/orders/webhook` | `stripeWebhook` |

---

# Часть 1. Сервер: запуск и база данных

## 1.1 back/package.json

**Что это за файл.** Паспорт серверного проекта: список библиотек и команд запуска. Его читает команда `npm install` (скачивает библиотеки в `node_modules`) и `npm run ...` (запускает команды).

- **стр. 2–5 `"scripts"`** — команды. `npm run dev` запускает `nodemon index.js` (сервер сам перезапускается при сохранении файла, удобно при разработке). `npm start` запускает `node index.js` — так сервер запускается на Render.
- **стр. 6–20 `"dependencies"`** — библиотеки, нужные для работы: `bcryptjs` (хеш паролей), `cors` (разрешение запросов с другого адреса), `dotenv` (чтение `.env`), `express` (веб-сервер), `express-mongo-sanitize` и `xss-clean` (установлены, но в коде не используются), `express-rate-limit` (ограничение числа запросов), `helmet` (защитные заголовки), `jsonwebtoken` (токены входа), `mongoose` (работа с MongoDB), `multer` (загрузка файлов), `resend` (отправка писем), `stripe` (оплата). Знак `^` перед версией значит «эта версия или новее в пределах той же главной версии».
- **стр. 21–23 `"devDependencies"`** — нужно только при разработке: `nodemon`.

## 1.2 back/index.js — запуск сервера

**Что это за файл.** Главный файл сервера. Команда `npm start` (или `npm run dev`) запускает именно его. Он собирает сервер из частей: подключает библиотеки, защиту, маршруты, обработчик ошибок, подключается к базе и начинает слушать порт.
**Кто подключает:** никто — это точка входа. Его запускает Node.
**Что подключает:** библиотеки (стр. 1–6) и свои файлы (стр. 8–13).

### Подключение библиотек (стр. 1–6)

```js
1 const express = require('express');
2 const cors = require('cors');
3 const path = require('path');
4 const helmet = require('helmet');
5 const rateLimit = require('express-rate-limit');
6 require('dotenv').config();
```

- **стр. 1** — `require('express')` загружает библиотеку Express и кладёт её в переменную `express`. `require` — встроенная функция Node: «дай мне то, что этот файл или библиотека отдаёт наружу». Express — это функция, которая создаёт веб-сервер.
- **стр. 2** — `cors` — функция-«разрешение». Браузер по умолчанию запрещает сайту с одного адреса (наш фронт, например `localhost:5173`) обращаться к серверу на другом адресе (`localhost:5000`). `cors()` добавляет в ответы заголовок «этому серверу можно отвечать любому сайту».
- **стр. 3** — `path` — встроенный модуль Node (устанавливать не надо) для работы с путями к файлам: склеить папки, взять расширение и т. п.
- **стр. 4** — `helmet` — добавляет в каждый ответ защитные заголовки (например, запрет показывать сайт внутри чужого `<iframe>`).
- **стр. 5** — `rateLimit` — функция, которая создаёт «счётчик запросов»: если с одного IP пришло слишком много запросов, следующие получают отказ.
- **стр. 6** — `require('dotenv')` возвращает объект, у него вызываем метод `.config()`. Он читает файл `.env` (если он есть) и кладёт каждую строку `ИМЯ=значение` в `process.env.ИМЯ`. `process` — встроенный объект Node с информацией о запущенной программе, `process.env` — переменные окружения. На Render файла `.env` нет: там значения задаются в настройках сервиса, и `process.env` заполняет сам Render.

### Подключение своих файлов (стр. 8–13)

```js
8  const connectDB = require('./db/connect');
9  const productsRoute = require('./routes/productsRoute.js');
10 const authRoute = require('./routes/authRoute.js');
11 const cartRoute = require('./routes/cartRoute.js');
12 const ordersRoute = require('./routes/ordersRoute.js');
13 const { stripeWebhook } = require('./controllers/OrderController');
```

- **стр. 8** — функция `connectDB` из `db/connect.js`. Путь начинается с `./` — значит «файл из этого проекта, относительно текущей папки», а не библиотека. Расширение `.js` можно не писать.
- **стр. 9–12** — четыре роутера. Каждый — набор адресов одного раздела: товары, вход, корзина, заказы. Сами по себе они ничего не делают, пока их не подключат на стр. 63–66.
- **стр. 13** — `OrderController.js` отдаёт объект с несколькими функциями. Фигурные скобки `{ stripeWebhook }` — «деструктуризация»: из объекта берём только поле `stripeWebhook` и кладём в одноимённую переменную. Это то же самое, что `const stripeWebhook = require('./controllers/OrderController').stripeWebhook;`.

### Создание приложения и первые настройки (стр. 15–27)

```js
15 const app = express();
16
17 // The site runs behind the hosting provider's proxy, so express has to trust
18 // it to read the real client IP (the rate limiters count per IP).
19 app.set('trust proxy', 1);
20
21 app.use(cors());
22
23 // Stripe sends the webhook with a signature over the raw body, so this one
24 // route has to be registered before express.json() parses the body away.
25 app.post('/api/orders/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
26
27 app.use(express.json());
```

- **стр. 15** — вызываем `express()` и получаем объект `app` — это и есть наш сервер. Дальше мы его настраиваем: `app.use(...)`, `app.get(...)`, `app.post(...)`, `app.listen(...)`.
- **стр. 19** — `app.set('trust proxy', 1)` — настройка Express. На Render запрос сначала приходит на их прокси-сервер, а уже он пересылает его нам. Без этой строки Express видел бы IP прокси, и все посетители считались бы одним человеком — счётчики запросов (стр. 34–58) заблокировали бы всех сразу. `1` — «доверять одному прокси перед нами»: тогда Express берёт настоящий IP посетителя из заголовка `X-Forwarded-For`.
- **стр. 21** — `app.use(функция)` — подключить middleware (промежуточную функцию) для **всех** запросов. Middleware — функция, которая выполняется до того, как запрос дойдёт до нужного адреса. Здесь это `cors()` — разрешение запросов с другого адреса (см. стр. 2).
- **стр. 25** — отдельный адрес для Stripe: `app.post(адрес, функция1, функция2)`. На запрос `POST /api/orders/webhook` сначала выполнится `express.raw(...)`, потом `stripeWebhook`.
  - `express.raw({ type: 'application/json' })` оставляет тело запроса «как есть» — набором байтов (Buffer) — и кладёт его в `req.body`.
  - Зачем: Stripe подписывает запрос, и подпись проверяется по **точным байтам** тела. Если тело сначала разобрать в объект (как делает `express.json()` на стр. 27), байты потеряются, и проверка подписи не пройдёт.
  - Поэтому эта строка стоит **до** стр. 27: Express проверяет подключения сверху вниз, и для этого адреса до `express.json()` дело не дойдёт.
- **стр. 27** — `express.json()` — для всех остальных запросов: если тело пришло в формате JSON (`{"email":"a@b.c"}`), превратить его в объект JavaScript и положить в `req.body`. Без этой строки `req.body` был бы `undefined`.

### Защитные заголовки и ограничение запросов (стр. 29–58)

```js
29 // Security headers. crossOriginResourcePolicy is off so the React app
30 // on another port can still load the product images from /uploads.
31 app.use(helmet({ crossOriginResourcePolicy: false }));
32
33 // General limit: 100 requests per 15 minutes from the same IP.
34 const limiter = rateLimit({
35   windowMs: 15 * 60 * 1000,
36   max: 100,
37   message: 'Too many requests from this IP, please try again later.'
38 });
39 app.use('/api/', limiter);
```

- **стр. 31** — подключаем `helmet` для всех ответов. В скобках — настройка: `crossOriginResourcePolicy: false` выключает один из заголовков. Он запрещал бы браузеру показывать картинки нашего сервера на странице с другого адреса — а фронт как раз на другом адресе и показывает картинки товаров из `/uploads`.
- **стр. 34–38** — создаём общий счётчик. `rateLimit({...})` принимает объект настроек:
  - **стр. 35** — `windowMs` — длина «окна» в миллисекундах: `15 * 60 * 1000` = 15 минут × 60 секунд × 1000 миллисекунд = 900 000 мс.
  - **стр. 36** — `max: 100` — не больше 100 запросов с одного IP за это окно.
  - **стр. 37** — `message` — что ответить 101-му запросу (код ответа будет 429 «Too Many Requests»).
- **стр. 39** — подключаем счётчик только к адресам, которые начинаются с `/api/`. Картинки (`/uploads`) не считаются.

```js
41 // Stricter limit on the login routes, to block password guessing.
42 const authLimiter = rateLimit({
43   windowMs: 15 * 60 * 1000,
44   max: 10,
45   skipSuccessfulRequests: true,
46   message: 'Too many authentication attempts, please try again later.'
47 });
48 app.use('/api/auth/signin', authLimiter);
49 app.use('/api/auth/signup', authLimiter);
50 app.use('/api/auth/reset-password', authLimiter);
51
52 // Asking for a reset link is limited harder: 5 per hour from the same IP.
53 const resetLimiter = rateLimit({
54   windowMs: 60 * 60 * 1000,
55   max: 5,
56   message: 'Too many password reset requests. Please try again in an hour.'
57 });
58 app.use('/api/auth/forgot-password', resetLimiter);
```

- **стр. 42–47** — второй, строгий счётчик для входа:
  - **стр. 43** — то же окно 15 минут;
  - **стр. 44** — но всего 10 попыток;
  - **стр. 45** — `skipSuccessfulRequests: true` — удачные попытки (ответ с кодом 2xx) не считаются. Считаются только ошибки — так блокируется подбор пароля, а человек, который нормально вошёл, не страдает;
  - **стр. 46** — текст отказа.
- **стр. 48–50** — подключаем этот счётчик к трём адресам: вход, регистрация, новый пароль по ссылке. Для них работают **оба** счётчика: общий (стр. 39) и строгий.
- **стр. 53–57** — третий счётчик, для «забыли пароль»: окно `60 * 60 * 1000` = 1 час, максимум 5 запросов. Строже всех, потому что каждый такой запрос отправляет письмо.
- **стр. 58** — подключаем его к адресу `/api/auth/forgot-password`.

### Картинки и маршруты (стр. 60–70)

```js
60 // Product images are served as static files.
61 app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
62
63 app.use('/api/products', productsRoute);
64 app.use('/api/auth', authRoute);
65 app.use('/api/cart', cartRoute);
66 app.use('/api/orders', ordersRoute);
67
68 app.get('/', (req, res) => {
69   res.send('<h2>DARINS HANDMADE API</h2>');
70 });
```

- **стр. 61** — раздача картинок. `express.static(папка)` — middleware, который отдаёт файлы из папки как есть. `path.join(__dirname, 'uploads')` — полный путь к папке `back/uploads`: `__dirname` — встроенная переменная Node, папка текущего файла (`back`). Первый аргумент `'/uploads'` — с какого адреса раздавать. Итог: файл `back/uploads/pink-123.jpg` доступен по адресу `http://сервер/uploads/pink-123.jpg`.
- **стр. 63** — `app.use('/api/products', productsRoute)` — все адреса, которые начинаются с `/api/products`, передаются в роутер товаров. Внутри роутера адреса пишутся без этой приставки: `router.get('/:id', ...)` там — это `GET /api/products/:id` здесь.
- **стр. 64** — адреса входа и регистрации — в `authRoute`.
- **стр. 65** — корзина — в `cartRoute`.
- **стр. 66** — заказы — в `ordersRoute`. (Вебхук `/api/orders/webhook` уже обработан на стр. 25, до этой строки он не дойдёт.)
- **стр. 68–70** — `app.get('/', функция)` — ответ на открытие самого адреса сервера в браузере. Функция получает `req` (запрос) и `res` (ответ); `res.send(...)` отправляет текст — здесь маленький HTML-заголовок. Нужно, чтобы было видно: сервер живой.

### Общий обработчик ошибок (стр. 72–85)

```js
72 // One place for errors that were thrown outside a controller, so the client
73 // always gets JSON back (a failed image upload would return HTML otherwise).
74 app.use((err, req, res, next) => {
75   if (err.name === 'MulterError') {
76     const message =
77       err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 8MB)' : 'Image upload failed';
78     return res.status(400).send({ message });
79   }
80   if (err.message === 'Only image files are allowed') {
81     return res.status(400).send({ message: err.message });
82   }
83   console.log(err.message);
84   res.status(500).send({ message: 'Server error' });
85 });
```

- **стр. 74** — middleware с **четырьмя** параметрами `(err, req, res, next)`. Express узнаёт обработчик ошибок именно по четырём параметрам: он вызывается, только если где-то раньше произошла ошибка, которую не поймал контроллер. В нашем проекте такие ошибки бросает загрузка картинок (multer) — она работает до контроллера, и его `try/catch` её не ловит.
- **стр. 75** — `err.name === 'MulterError'` — ошибка самой библиотеки multer (например, файл слишком большой).
- **стр. 76–77** — выбираем текст. Тернарный оператор `условие ? значение_если_да : значение_если_нет`: если код ошибки `'LIMIT_FILE_SIZE'` (файл больше 8 МБ, лимит задан в `upload.js`) — `'Image is too large (max 8MB)'`, иначе — общее `'Image upload failed'`.
- **стр. 78** — `res.status(400)` — код ответа 400 «плохой запрос»; `.send({ message })` — отправить объект `{ message: message }` (короткая запись: имя поля совпадает с именем переменной). Express сам превратит объект в JSON. `return` — закончить функцию, чтобы ниже ничего не выполнилось.
- **стр. 80–82** — ошибку с текстом `'Only image files are allowed'` бросает наш `fileFilter` в `upload.js` (стр. 39), если прислали не картинку. Отвечаем 400 с этим же текстом.
- **стр. 83** — любую другую ошибку пишем в консоль сервера (на Render её видно во вкладке Logs).
- **стр. 84** — клиенту — код 500 «ошибка сервера» и общий текст, без подробностей (подробности могут раскрыть устройство сервера).

### Запуск (стр. 87–98)

```js
87 const start = async () => {
88   try {
89     await connectDB(process.env.MONGO_URI);
90     const port = process.env.PORT || 5000;
91     app.listen(port, () =>
92       console.log(`Masad netunim connected. Server is listening on port ${port}...`));
93   } catch (error) {
94     console.log(error);
95   }
96 };
97
98 start();
```

- **стр. 87** — функция `start`. `async` — внутри можно писать `await`, то есть ждать результата долгой операции (подключения к базе), не останавливая весь Node.
- **стр. 88** — `try { ... } catch (error) { ... }` — если внутри `try` что-то упадёт, выполнение перейдёт в `catch`, а не уронит программу.
- **стр. 89** — подключаемся к MongoDB. `process.env.MONGO_URI` — адрес базы из `.env` или из настроек Render. `connectDB` возвращает Promise (обещание результата), `await` ждёт, пока подключение закончится. Если база недоступна или адрес неверный — ошибка, и мы попадаем в `catch` на стр. 93.
- **стр. 90** — порт: `process.env.PORT` (его задаёт Render), а если такой переменной нет — `|| 5000`. Оператор `||` («или») возвращает левую часть, если она есть, иначе правую. На своём компьютере `PORT` обычно не задан, поэтому сервер работает на `5000`.
- **стр. 91–92** — `app.listen(порт, функция)` — начать принимать запросы на этом порту. Функция вызывается один раз, когда сервер готов, и пишет в консоль сообщение (`Masad netunim` — «база данных» на иврите). Обратные кавычки `` `...${port}...` `` — шаблонная строка: `${port}` заменяется значением переменной.
- **стр. 93–95** — если подключение к базе не удалось — печатаем ошибку целиком. Сервер в этом случае не запускается (до `app.listen` дело не дошло).
- **стр. 98** — вызываем `start()`. До этой строки функция только объявлена, а не выполнена.

## 1.3 back/db/connect.js — подключение к базе

**Что это за файл.** Одна функция, которая подключается к MongoDB.
**Кто подключает:** `index.js` (стр. 8), `seed/products.js` (стр. 2).
**Что подключает:** библиотеку `mongoose`.

```js
1 const mongoose = require('mongoose');
2
3 const connectDB = (url) => {
4   return mongoose.connect(url);
5 };
6
7 module.exports = connectDB;
```

- **стр. 1** — Mongoose — библиотека для работы с MongoDB из Node. Она умеет подключаться к базе, описывать, как выглядят документы (схемы, см. часть 2), и делать запросы (`find`, `create`, `findById`...).
- **стр. 3** — функция `connectDB` получает один параметр `url` — адрес базы, например `mongodb+srv://user:пароль@cluster.mongodb.net/darins`.
- **стр. 4** — `mongoose.connect(url)` начинает подключение и сразу возвращает Promise — «обещание», которое выполнится, когда подключение готово (или отклонится с ошибкой). `return` отдаёт этот Promise тому, кто вызвал функцию, — поэтому в `index.js` можно написать `await connectDB(...)` и дождаться подключения. После подключения все модели (`User`, `Product`...) работают с этой базой сами — передавать им подключение не нужно.
- **стр. 7** — `module.exports = connectDB` — что этот файл отдаёт наружу. Тот, кто напишет `require('./db/connect')`, получит именно эту функцию.

# Часть 2. Сервер: модели (как данные выглядят в базе)

**Общее для всех моделей.** `new mongoose.Schema({...})` — описание полей документа. `mongoose.model('Имя', схема)` создаёт **модель** — класс, у которого есть готовые методы Mongoose: `find`, `findOne`, `findById`, `create`, `findByIdAndUpdate`, `findByIdAndDelete`, `updateOne`, `aggregate` и другие. Мы эти методы не пишем — они приходят из библиотеки. Имя модели превращается в имя коллекции в базе: `'User'` → `users`, `'Product'` → `products`, `'Cart'` → `carts`, `'Order'` → `orders`.

Каждый документ в MongoDB автоматически получает поле `_id` — уникальный номер вида `65f1a2b3c4d5e6f7a8b9c0d1`.

## 2.1 back/models/userModel.js — пользователь

**Кто подключает:** `AuthController.js` (стр. 4), `authMiddleware.js` (стр. 2).

**Как читать описание поля.** Каждое поле — объект настроек:
- `type` — тип значения: `String` (строка), `Number` (число), `Date` (дата и время), `[String]` (массив строк), `mongoose.Schema.Types.ObjectId` (id другого документа);
- `required: true` — без этого поля документ не сохранится: Mongoose бросит ошибку проверки (ValidationError);
- `default` — какое значение поставить, если поле не передали;
- `unique: true` — в базе создаётся уникальный индекс: двух документов с одинаковым значением быть не может;
- `select: false` — поле не возвращается в обычных запросах.

```js
1  const mongoose = require('mongoose');
2
3  const userSchema = new mongoose.Schema(
4    {
5      name: {
6        type: String,
7        required: true
8      },
9      email: {
10       type: String,
11       required: true,
12       unique: true
13     },
14     password: {
15       type: String,
16       required: true,
17       // select: false keeps the password out of every normal query,
18       // so it is only loaded where we ask for it (in signin).
19       select: false
20     },
```

- **стр. 1** — подключаем Mongoose.
- **стр. 3** — `new mongoose.Schema(поля, настройки)` создаёт схему — описание того, как выглядит документ пользователя. Первый объект (стр. 4–41) — поля, второй (стр. 42–44) — настройки всей схемы.
- **стр. 5–8** — `name`: строка, обязательна. Регистрация без имени не сохранится.
- **стр. 9–13** — `email`: строка, обязательна, `unique: true` — двух пользователей с одной почтой быть не может. Если попытаться создать второго, база вернёт ошибку «duplicate key». (Контроллер `signup` всё равно сначала проверяет почту сам, чтобы ответить понятным текстом.)
- **стр. 14–20** — `password`: строка, обязательна. В базе здесь лежит **не пароль, а его хеш** — результат `bcrypt.hash` (см. `AuthController.js`). Из хеша нельзя получить пароль обратно.
  - **стр. 19** — `select: false` — поле не возвращается в обычных запросах: `User.findById(id)` вернёт пользователя **без** пароля. Чтобы получить его, нужно явно попросить `.select('+password')` — это делается только при входе (`signin`), где хеш нужен для сравнения.

```js
21     avatar: {
22       type: String,
23       default: ''
24     },
25     role: {
26       type: String,
27       default: 'user'
28     },
29     // Filled in only while a "forgot password" link is alive. The token is
30     // stored hashed, so even the database never holds the link itself.
31     resetPasswordToken: {
32       type: String,
33       default: null,
34       select: false
35     },
36     resetPasswordExpires: {
37       type: Date,
38       default: null,
39       select: false
40     }
41   },
42   {
43     timestamps: true
44   }
45 );
46
47 const User = mongoose.model('User', userSchema);
48 module.exports = User;
```

- **стр. 21–24** — `avatar`: ссылка на картинку профиля. Если не передали — пустая строка (`default: ''`).
- **стр. 25–28** — `role`: роль. По умолчанию `'user'` (обычный покупатель). Бывает `'manager'` и `'admin'` — им открыт раздел управления. Меняется только вручную в базе (см. 7.2).
- **стр. 31–35** — `resetPasswordToken`: хеш токена из ссылки «забыли пароль». Пока ссылку не запрашивали — `null`. Скрыт (`select: false`), чтобы случайно не уйти на фронт.
- **стр. 36–40** — `resetPasswordExpires`: до какого момента действует ссылка (тип `Date` — дата и время). По умолчанию `null`, скрыт.
- **стр. 42–44** — настройки схемы: `timestamps: true` — Mongoose сам добавит в каждый документ поля `createdAt` (когда создан) и `updatedAt` (когда изменён последний раз) и будет их обновлять.
- **стр. 47** — `mongoose.model('User', userSchema)` — создаём **модель** по схеме. Модель — это то, с чем работает остальной код: `User.findOne(...)`, `User.create(...)`. Документы попадут в коллекцию `users` (имя модели в нижнем регистре и во множественном числе).
- **стр. 48** — отдаём модель наружу.

## 2.2 back/models/productModel.js — товар

**Кто подключает:** `ProductController.js` (стр. 3), `OrderController.js` (стр. 4), `seed/products.js` (стр. 3).

```js
1  const mongoose = require('mongoose');
2
3  const productSchema = new mongoose.Schema(
4    {
5      file_name: {
6        type: String,
7        required: true
8      },
9      model_name: {
10       type: String,
11       required: true
12     },
13     color_palette: {
14       type: [String],
15       default: []
16     },
17     details: {
18       type: [String],
19       default: []
20     },
21     style: {
22       type: [String],
23       default: []
24     },
```

- **стр. 3** — схема товара. Поля — стр. 4–40, настройки — стр. 41–43.
- **стр. 5–8** — `file_name`: путь к картинке на сервере, например `uploads/pink-bag-1718000000000.jpg`. Обязателен — товар без картинки не сохранится. Полный адрес для браузера фронт собирает функцией `imageUrl` (`api.jsx`).
- **стр. 9–12** — `model_name`: название товара, обязательно.
- **стр. 13–16** — `color_palette`: массив строк — цвета, например `["Pink", "White"]`. `type: [String]` — квадратные скобки значат «массив таких значений». Если не передали — пустой массив.
- **стр. 17–20** — `details`: массив строк — особенности («Handmade», «Glass beads»). По умолчанию пустой.
- **стр. 21–24** — `style`: массив строк — стиль («Evening», «Casual»). По умолчанию пустой.

```js
25     category: {
26       type: String,
27       required: true,
28       enum: ['bags', 'bracelets']
29     },
30     price: {
31       type: Number
32     },
33     // How many are left. null means the stock is not being tracked
34     // for this product, so it is always available.
35     stock: {
36       type: Number,
37       default: null,
38       min: 0
39     }
40   },
41   {
42     timestamps: true
43   }
44 );
45
46 const Product = mongoose.model('Product', productSchema);
47 module.exports = Product;
```

- **стр. 25–29** — `category`: строка, обязательна. `enum: ['bags', 'bracelets']` — разрешены **только** эти два значения. Если прислать `'shoes'`, Mongoose откажется сохранять (ValidationError) — `createProduct` поймает ошибку в `catch` и ответит 400.
- **стр. 30–32** — `price`: число. Не обязательное. Если из формы пришла строка `"120"`, Mongoose сам превратит её в число 120.
- **стр. 35–39** — `stock`: сколько штук осталось.
  - `default: null` — по умолчанию `null`, а `null` значит «остаток не отслеживается, товар всегда в наличии»;
  - `min: 0` — отрицательное число Mongoose не сохранит.
  - Когда заказ оплачен, `stripeWebhook` уменьшает это число (`OrderController.js`).
- **стр. 41–43** — `timestamps: true` — поля `createdAt` и `updatedAt`.
- **стр. 46** — модель `Product`, документы — в коллекции `products`.
- **стр. 47** — отдаём модель наружу.

## 2.3 back/models/cartModel.js — корзина

**Кто подключает:** `CartController.js` (стр. 1).

У каждого вошедшего пользователя — одна корзина в базе. (Корзина гостя хранится не здесь, а в браузере, в `localStorage` — см. `CartContext.jsx`.)

```js
1  const mongoose = require('mongoose');
2
3  const cartSchema = new mongoose.Schema(
4    {
5      // Every user has one cart. ref tells mongoose which collection
6      // to pull from when we call populate().
7      user: {
8        type: mongoose.Schema.Types.ObjectId,
9        ref: 'User',
10       required: true
11     },
12     items: [
13       {
14         product: {
15           type: mongoose.Schema.Types.ObjectId,
16           ref: 'Product',
17           required: true
18         },
19         quantity: {
20           type: Number,
21           default: 1
22         }
23       }
24     ]
25   },
26   {
27     timestamps: true
28   }
29 );
30
31 const Cart = mongoose.model('Cart', cartSchema);
32 module.exports = Cart;
```

- **стр. 3** — схема корзины. Поля — стр. 4–24, настройки — стр. 25–27.
- **стр. 7–11** — `user`: чья это корзина.
  - `type: mongoose.Schema.Types.ObjectId` — значение — это id документа (вида `65f1a2b3...`), а не строка с именем.
  - `ref: 'User'` — подсказка Mongoose: этот id указывает на документ модели `User`. Нужна для `populate` — тогда вместо id можно подставить весь документ.
  - `required: true` — корзина без владельца не сохранится.
- **стр. 12–24** — `items`: квадратные скобки — массив. Каждый элемент массива — объект с двумя полями (стр. 13–23):
  - **стр. 14–18** — `product`: id товара, `ref: 'Product'`. В корзине хранится **только ссылка**, не сам товар: если менеджер поменяет цену, корзина сразу покажет новую. Сам товар подставляется методом `populate` в `CartController.js` (стр. 6).
  - **стр. 19–22** — `quantity`: количество, по умолчанию 1.
  - Пример документа корзины: `{ user: ObjectId('65aa...'), items: [{ product: ObjectId('65f1...'), quantity: 2 }] }`.
- **стр. 25–27** — `timestamps: true` — поля `createdAt`, `updatedAt`.
- **стр. 31** — модель `Cart`, коллекция `carts`.
- **стр. 32** — отдаём наружу.

## 2.4 back/models/orderModel.js — заказ

**Кто подключает:** `OrderController.js` (стр. 3).

Здесь поля записаны короче, в одну строку: `name: { type: String, required: true }` — то же самое, что в других моделях на четыре строки.

### Схема одной позиции заказа (стр. 3–16)

```js
1  const mongoose = require('mongoose');
2
3  const orderItemSchema = new mongoose.Schema({
4    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
5    name: { type: String, required: true },
6    category: { type: String, default: '' },
7    image: { type: String, default: '' },
8    price: { type: Number, required: true },
9    quantity: { type: Number, required: true, min: 1 },
10   custom: {
11     size: String,
12     strap: String,
13     chainColor: String,
14     color: String,
15   },
16 }, { _id: false });
```

- **стр. 3** — отдельная схема для **одной строки заказа**. Она не становится моделью, а вставляется внутрь заказа как массив (стр. 32).
- **стр. 4** — `product`: id товара каталога, `ref: 'Product'`. Для сумки из конструктора — `null` (такого товара в базе нет), поэтому `default: null` и не `required`.
- **стр. 5** — `name`: название **на момент покупки**, обязательно. Это копия, а не ссылка: если потом товар переименуют или удалят, в заказе останется то, что реально купили.
- **стр. 6** — `category`: категория, тоже копия. Для конструктора — `'custom'`.
- **стр. 7** — `image`: путь к картинке, копия.
- **стр. 8** — `price`: цена за штуку **на момент покупки**, обязательна. Её всегда ставит сервер (`buildOrderItems`), а не браузер.
- **стр. 9** — `quantity`: количество, обязательно, `min: 1` — ноль или минус не сохранится.
- **стр. 10–15** — `custom`: вложенный объект — параметры сумки из конструктора: `size` (размер), `strap` (ремешок), `chainColor` (цвет цепочки, только у ремешка Mixed), `color` (цвет бусин). Запись `size: String` — короткая форма `size: { type: String }`. Для обычного товара здесь `null`.
- **стр. 16** — второй аргумент схемы — настройки: `{ _id: false }`. Обычно Mongoose даёт каждому вложенному объекту свой `_id`. Строкам заказа он не нужен — они существуют только внутри заказа.

### Схема заказа (стр. 18–50)

```js
18 const orderSchema = new mongoose.Schema({
19   orderNumber: { type: String, required: true, unique: true },
20   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
21   customer: {
22     name: { type: String, required: true },
23     email: { type: String, required: true },
24     phone: { type: String, default: '' },
25   },
26   shipping: {
27     address: { type: String, default: '' },
28     city: { type: String, default: '' },
29     country: { type: String, default: '' },
30   },
31   deliveryMethod: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
32   items: { type: [orderItemSchema], required: true },
33   subtotal: { type: Number, required: true },
34   total: { type: Number, required: true },
35   currency: { type: String, default: 'usd' },
36   status: {
37     type: String,
38     enum: ['pending', 'paid', 'in_production', 'shipped', 'completed', 'cancelled'],
39     default: 'pending',
40   },
41   payment: {
42     provider: { type: String, default: 'stripe' },
43     sessionId: { type: String, default: null },
44     paymentIntentId: { type: String, default: null },
45     paidAt: { type: Date, default: null },
46   },
47   notes: { type: String, default: '' },
48 }, { timestamps: true });
49
50 module.exports = mongoose.model('Order', orderSchema);
```

- **стр. 19** — `orderNumber`: номер вида `DH-20261021-4821` (создаёт `genOrderNumber` в `OrderController.js`). Обязателен и уникален.
- **стр. 20** — `user`: id пользователя, который заказал. `null`, если покупал гость без входа.
- **стр. 21–25** — `customer`: вложенный объект с контактами — `name` и `email` обязательны, `phone` — нет (по умолчанию пустая строка).
- **стр. 26–30** — `shipping`: адрес доставки — адрес, город, страна. Для самовывоза все три пустые.
- **стр. 31** — `deliveryMethod`: способ получения. `enum` — только `'delivery'` (доставка) или `'pickup'` (самовывоз); по умолчанию доставка.
- **стр. 32** — `items`: `type: [orderItemSchema]` — массив строк по схеме со стр. 3–16. Обязателен.
- **стр. 33** — `subtotal`: сумма всех строк (цена × количество).
- **стр. 34** — `total`: итог к оплате. Сейчас равен `subtotal` — доставка бесплатная.
- **стр. 35** — `currency`: валюта, по умолчанию `'usd'` (доллары).
- **стр. 36–40** — `status`: статус заказа, один из шести (`enum`).
  - Новый заказ — `pending` (создан, ждёт оплаты).
  - После оплаты `stripeWebhook` ставит `paid`.
  - Дальше менеджер вручную переводит: `in_production` (в работе) → `shipped` (отправлен) → `completed` (выполнен), или `cancelled` (отменён).
- **стр. 41–46** — `payment`: данные оплаты.
  - `provider` — кто принимал оплату, всегда `'stripe'`;
  - `sessionId` — id страницы оплаты Stripe; по нему страница «Спасибо» найдёт заказ;
  - `paymentIntentId` — id самого платежа в Stripe (пригодится, чтобы найти платёж в кабинете Stripe);
  - `paidAt` — дата и время оплаты.
- **стр. 47** — `notes`: комментарий покупателя.
- **стр. 48** — настройки схемы: `timestamps: true`. Поле `createdAt` используется для сортировки списка заказов и для статистики «за 7/30 дней».
- **стр. 50** — сразу создаём модель `Order` и отдаём наружу — в одну строку, без отдельной переменной. Коллекция — `orders`.

# Часть 3. Сервер: middleware (проверки перед контроллером)

**Что такое middleware.** Функция с тремя параметрами `(req, res, next)`, которую Express вызывает **до** контроллера. Она либо пропускает запрос дальше вызовом `next()`, либо сама отвечает (`res.status(...).send(...)`) — и тогда контроллер не вызывается.

- `req` (request) — запрос: `req.body` (тело), `req.params` (части адреса вида `:id`), `req.query` (параметры после `?`), `req.headers` (заголовки), `req.file` (загруженный файл), `req.user` (пользователь — его кладёт `protect`).
- `res` (response) — ответ: `res.status(код)`, `res.json(объект)`, `res.send(...)`.
- `next` — функция «передать дальше».

## 3.1 back/middleware/authMiddleware.js — `protect`, проверка входа

**Что это за файл.** Одна функция `protect`. Она стоит перед каждым адресом, куда можно только вошедшим: проверяет токен входа и, если он настоящий, кладёт данные пользователя в `req.user`.
**Кто подключает:** `cartRoute.js`, `productsRoute.js`, `ordersRoute.js`, `authRoute.js` (для `/me`).
**Что подключает:** `jsonwebtoken` (стр. 1), модель `User` (стр. 2).

**Что такое токен.** После входа сервер выдаёт строку-токен (JWT), фронт хранит её в `localStorage` и прикладывает к каждому защищённому запросу в заголовке:
`Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY1Zj...`
Внутри токена записан id пользователя, и он подписан секретом сервера (`JWT_SECRET`). Подделать или изменить токен без секрета нельзя — подпись не сойдётся.

### Функция `protect` (стр. 6–40)

```js
1  const jwt = require('jsonwebtoken');
2  const User = require('../models/userModel.js');
3
4  // Runs before a protected route. It checks the token that the client sent
5  // in the Authorization header and puts the user on req.user.
6  const protect = async (req, res, next) => {
7    const authHeader = req.headers.authorization;
8
9    // The header looks like: "Bearer eyJhbGciOi..."
10   if (!authHeader || !authHeader.startsWith('Bearer ')) {
11     return res.status(401).send({ message: 'No token, authorization denied' });
12   }
```

- **стр. 1** — библиотека `jsonwebtoken` — создаёт и проверяет токены.
- **стр. 2** — модель `User` — чтобы найти пользователя в базе.
- **стр. 6** — `protect` — middleware: три параметра `(req, res, next)`. Express вызывает её **до** контроллера. Она либо вызывает `next()` (пропустить дальше), либо сама отвечает ошибкой — и контроллер не вызывается. `async` — внутри будет `await` (запрос к базе).
- **стр. 7** — `req.headers.authorization` — значение заголовка `Authorization`. Например `'Bearer eyJhbGci...'`. Если фронт заголовок не прислал — `undefined`.
- **стр. 10** — две проверки через `||` («или»):
  - `!authHeader` — заголовка нет совсем;
  - `!authHeader.startsWith('Bearer ')` — заголовок есть, но начинается не с `'Bearer '` (с пробелом). `startsWith` — метод строки: «начинается ли с…».
  - Если верна хоть одна часть — входа нет. Вторая часть выполняется только когда первая `false`, то есть заголовок точно есть — поэтому `.startsWith` от `undefined` не упадёт.
- **стр. 11** — ответ **401** («не авторизован» — нужно войти) и `return`: функция закончена, `next()` не вызывается, контроллер не выполнится.

```js
14   try {
15     const token = authHeader.split(' ')[1];
16
17     // verify() throws if the token was changed or has expired.
18     const decoded = jwt.verify(token, process.env.JWT_SECRET);
19
20     // The role is read from the database and not from the token, so a manager
21     // who lost the permission cannot keep using a token that is still valid.
22     const user = await User.findById(decoded.id);
23     if (!user) {
24       return res.status(401).send({ message: 'User no longer exists' });
25     }
26
27     req.user = {
28       id: user._id,
29       name: user.name,
30       email: user.email,
31       avatar: user.avatar,
32       role: user.role
33     };
34
35     next();
36   } catch (error) {
37     console.log(error.message);
38     res.status(401).send({ message: 'Token is invalid or has expired' });
39   }
40 };
41
42 module.exports = protect;
```

- **стр. 14** — `try`: проверка токена может бросить ошибку, её поймает `catch` на стр. 36.
- **стр. 15** — достаём сам токен из заголовка.
  - `authHeader.split(' ')` режет строку по пробелу: `'Bearer eyJhbGci...'` → `['Bearer', 'eyJhbGci...']`.
  - `[1]` — второй элемент массива (счёт с нуля) — это токен.
- **стр. 18** — `jwt.verify(токен, секрет)` — проверить подпись токена секретом из `.env` и срок действия (токен живёт 1 час). Если всё хорошо — возвращает то, что записали в токен при входе: `{ id: '65aa...', name: 'Anna', email: '...', role: 'user', iat: ..., exp: ... }` (`iat` — когда выдан, `exp` — до когда действует). Если токен подделан, испорчен или истёк — **бросает ошибку**, и мы сразу попадаем в `catch` (стр. 36).
- **стр. 22** — `User.findById(decoded.id)` — ищем пользователя в базе по id из токена. Зачем, если данные уже есть в токене? Роль в токене могла устареть: если менеджера лишили роли, его старый токен ещё час был бы действителен. А роль из базы — всегда актуальная.
- **стр. 23–25** — пользователя нет (например, его удалили из базы) — 401 и выйти.
- **стр. 27–33** — кладём данные пользователя в `req.user`. `req` — один и тот же объект на всём пути запроса, поэтому контроллер, который выполнится после `next()`, увидит `req.user`. Пароля здесь нет — только `id`, `name`, `email`, `avatar`, `role`.
- **стр. 35** — `next()` — «всё в порядке, передай запрос дальше»: следующему middleware (`restrictTo`) или контроллеру.
- **стр. 36–39** — `catch`: токен не прошёл `verify` или упал запрос к базе. Пишем текст ошибки в консоль сервера (например `jwt expired`) и отвечаем 401 «токен неверный или истёк». Фронт на 401 разлогинивает пользователя.
- **стр. 42** — `module.exports = protect;` — отдаём функцию наружу. В роутерах: `const protect = require('../middleware/authMiddleware');`.

## 3.2 back/middleware/roleMiddleware.js — `restrictTo`, проверка роли

**Что это за файл.** Функция `restrictTo`. Ставится **после** `protect` и пропускает только пользователей с нужной ролью — например, только менеджеров.
**Кто подключает:** `productsRoute.js`, `ordersRoute.js`.
**Как используется:** `router.post('/', protect, restrictTo('manager', 'admin'), createProduct);`

```js
1  // Runs after protect. It allows the request only if the role of the user
2  // is one of the roles we listed, for example restrictTo('manager', 'admin').
3  const restrictTo = (...roles) => {
4    return (req, res, next) => {
5      if (!req.user || !roles.includes(req.user.role)) {
6        return res.status(403).send({ message: 'Manager access only' });
7      }
8      next();
9    };
10 };
11
12 module.exports = restrictTo;
```

- **стр. 3** — `restrictTo` — функция, которая **возвращает** middleware. Её вызывают со списком ролей, а она отдаёт готовую функцию `(req, res, next)`, которая помнит этот список.
  - `(...roles)` — «остаточные параметры»: все аргументы собираются в массив. `restrictTo('manager', 'admin')` → внутри `roles = ['manager', 'admin']`.
- **стр. 4** — возвращаем саму проверку. Express вызовет её на каждый запрос к этому адресу. Переменная `roles` ей доступна, хотя `restrictTo` уже закончила работу, — функция «запоминает» переменные, среди которых её создали (это называется замыкание).
- **стр. 5** — две проверки через `||`:
  - `!req.user` — `protect` не положил пользователя (на всякий случай, если `restrictTo` поставят без `protect`);
  - `!roles.includes(req.user.role)` — роль пользователя **не** входит в список. `includes` — метод массива: «есть ли в массиве такое значение». `['manager', 'admin'].includes('user')` → `false`, с `!` → `true` — значит, нельзя.
- **стр. 6** — ответ **403** («запрещено»: человек вошёл, но прав не хватает — в отличие от 401 «не вошёл») и `return`.
- **стр. 8** — роль подходит — `next()`, дальше в контроллер.
- **стр. 12** — отдаём `restrictTo` наружу.

## 3.3 back/middleware/upload.js — загрузка картинок (multer)

**Что это за файл.** Настраивает библиотеку multer: куда сохранять картинку из формы, как её назвать и какие файлы пропускать.
**Кто подключает:** `productsRoute.js` (стр. 11).
**Что подключает:** `multer` (стр. 1), встроенные `path` (стр. 2, пути к файлам) и `fs` (стр. 3, работа с файлами на диске).

**Зачем multer.** Форма товара в админке отправляет картинку в формате `multipart/form-data` — это не JSON, `express.json()` его не понимает. Multer разбирает такой запрос: файл сохраняет на диск и кладёт сведения о нём в `req.file`, а текстовые поля формы — в `req.body`.

### Где и под каким именем сохранять (стр. 5–32)

```js
1  const multer = require('multer');
2  const path = require('path');
3  const fs = require('fs');
4
5  // multer takes the picture out of the form and saves it on the disk.
6  const storage = multer.diskStorage({
7    // Which folder the picture goes to.
8    destination: (req, file, cb) => {
9      const dir = path.join(__dirname, '..', 'uploads');
10     fs.mkdirSync(dir, { recursive: true });
11     cb(null, dir);
12   },
13
14   // Which name it gets. Date.now() is added so two pictures with the
15   // same original name do not overwrite each other.
16   filename: (req, file, cb) => {
17     // "My Bag!.JPG" -> ".jpg"
18     const ext = path.extname(file.originalname).toLowerCase();
19
20     // "My Bag!.JPG" -> "My Bag!"
21     let base = path.basename(file.originalname, ext);
22     // Every character that is not a letter or a digit becomes "-": "My-Bag-"
23     base = base.replace(/[^a-z0-9]/gi, '-');
24     // "my-bag-"
25     base = base.toLowerCase();
26     // A very long name is cut to 40 characters.
27     base = base.slice(0, 40);
28
29     // "my-bag--1718000000000.jpg"
30     cb(null, `${base}-${Date.now()}${ext}`);
31   }
32 });
```

- **стр. 1–3** — подключаем multer, `path` и `fs`.
- **стр. 6** — `multer.diskStorage({...})` — «хранилище на диске». Получает объект с двумя функциями: `destination` (в какую папку) и `filename` (какое имя). Multer сам вызывает их для каждого загруженного файла.
- **стр. 8** — функция `destination`. Параметры:
  - `req` — запрос;
  - `file` — сведения о файле: `originalname` (имя на компьютере менеджера, например `Pink Bag.JPG`), `mimetype` (тип, например `image/jpeg`);
  - `cb` — callback, функция «ответа»: её нужно вызвать и передать результат.
- **стр. 9** — полный путь к папке: `path.join` склеивает части пути правильными для системы разделителями. `__dirname` — папка этого файла (`back/middleware`), `'..'` — подняться на уровень вверх, `'uploads'` — папка. Итог: `back/uploads`.
- **стр. 10** — `fs.mkdirSync(dir, { recursive: true })` — создать папку. `Sync` — синхронно (дождаться прямо здесь). `recursive: true` — не ругаться, если папка уже есть (и создать промежуточные папки, если нужно). На Render при каждом новом запуске диск чистый, поэтому папку надо создавать.
- **стр. 11** — `cb(null, dir)`: первый аргумент — ошибка (`null` — ошибки нет), второй — папка.
- **стр. 16** — функция `filename`, те же параметры. Решает, как назвать файл на диске.
- **стр. 18** — `path.extname('Pink Bag.JPG')` → `'.JPG'` (расширение с точкой); `.toLowerCase()` → `'.jpg'`.
- **стр. 21** — `path.basename(имя, расширение)` — имя без папки и без расширения: `'Pink Bag'`. `let`, потому что дальше переменная `base` меняется по шагам.
- **стр. 23** — `base.replace(/[^a-z0-9]/gi, '-')` — заменить символы. Регулярное выражение `/[^a-z0-9]/gi` читается так:
  - `[a-z0-9]` — любая латинская буква или цифра;
  - `^` внутри квадратных скобок — «**не**»: значит, любой символ, который не буква и не цифра (пробел, `!`, кириллица…);
  - `g` — заменить все такие символы, а не только первый; `i` — без учёта регистра (`A` тоже буква).
  - `'Pink Bag'` → `'Pink-Bag'`. Так в имени файла не будет пробелов и странных символов, которые ломают адрес.
- **стр. 25** — в нижний регистр: `'pink-bag'`.
- **стр. 27** — `slice(0, 40)` — оставить первые 40 символов, чтобы очень длинное имя не мешало.
- **стр. 30** — `cb(null, итоговоеИмя)`. Имя: `` `${base}-${Date.now()}${ext}` `` → `pink-bag-1718000000000.jpg`. `Date.now()` — текущее время в миллисекундах (число вроде `1718000000000`), оно каждый раз разное, поэтому два файла с одинаковым названием не перезапишут друг друга.

### Какие файлы пропускать (стр. 34–40)

```js
34 // Only real pictures are accepted, so nobody can upload a script.
35 const fileFilter = (req, file, cb) => {
36   if (/^image\//.test(file.mimetype)) {
37     return cb(null, true);
38   }
39   cb(new Error('Only image files are allowed'), false);
40 };
41
42 const upload = multer({
43   storage,
44   fileFilter,
45   limits: { fileSize: 8 * 1024 * 1024 }
46 });
47
48 module.exports = upload;
```

- **стр. 35** — `fileFilter` — функция-фильтр. Multer вызывает её **до** сохранения файла.
- **стр. 36** — `file.mimetype` — тип файла, например `'image/jpeg'`, `'image/png'`, `'application/pdf'`. Регулярное выражение `/^image\//` — «начинается с `image/`» (`^` вне скобок — начало строки, `\/` — сам символ `/`). `.test(строка)` возвращает `true` или `false`.
- **стр. 37** — картинка — `cb(null, true)`: ошибки нет, файл принять. `return` — дальше не идти.
- **стр. 39** — не картинка — `cb(new Error('...'), false)`: передаём ошибку и не принимаем файл. Эту ошибку поймает обработчик ошибок в `index.js` (стр. 80) и ответит 400.
- **стр. 42–46** — создаём сам объект multer с тремя настройками:
  - `storage` — хранилище со стр. 6 (короткая запись `storage: storage`);
  - `fileFilter` — фильтр со стр. 35;
  - `limits: { fileSize: 8 * 1024 * 1024 }` — максимум 8 МБ (8 × 1024 × 1024 байт). Больше — ошибка `LIMIT_FILE_SIZE`, обрабатывается в `index.js` (стр. 77).
- **стр. 48** — отдаём наружу. В роутере используется как `upload.single('image')` — «в форме одно поле-файл с именем `image`». После него контроллер получает файл в `req.file` (`req.file.filename` — имя, которое мы придумали на стр. 30), а текстовые поля формы — в `req.body`.

## 3.4 back/middleware/validate.js — проверка форм входа и регистрации

**Что это за файл.** Две middleware-функции: `validateSignup` и `validateSignin`. Они проверяют данные формы **до** контроллера, чтобы неверный ввод не дошёл до базы.
**Кто подключает:** `authRoute.js` (стр. 3).
**Ничего не подключает.**

### Константы и помощники (стр. 4–21)

```js
1  // Checks the data that arrives from the forms before it reaches a controller,
2  // so wrong input is stopped early and never gets to the database.
3
4  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
5
6  const NAME_MIN = 2;
7  const NAME_MAX = 60;
8  const EMAIL_MAX = 254;
9  const PASSWORD_MIN = 8;
10 const PASSWORD_MAX = 128;
11
12 const isString = (value) => typeof value === 'string';
13
14 const fail = (res, message) => res.status(400).send({ message });
15
16 // Returns the clean email, or null when it is not a valid address.
17 const checkEmail = (email) => {
18   const trimmed = email.trim().toLowerCase();
19   if (trimmed.length > EMAIL_MAX || !EMAIL_RE.test(trimmed)) return null;
20   return trimmed;
21 };
```

- **стр. 4** — `EMAIL_RE` — регулярное выражение (шаблон) для почты. Читается по частям:
  - `^` и `$` — начало и конец строки: шаблону должна соответствовать **вся** строка;
  - `[^\s@]+` — один или больше (`+`) символов, которые **не** (`^` внутри скобок) пробел (`\s`) и не `@`;
  - `@` — сам символ `@`;
  - снова `[^\s@]+` — домен;
  - `\.` — точка (обратный слеш — «настоящая точка», а не «любой символ»);
  - `[^\s@]+` — окончание домена.
  - Пример: `anna@mail.com` подходит; `anna@mail`, `anna mail@x.com`, `@mail.com` — нет.
- **стр. 6–10** — границы длины: имя 2–60 символов, почта до 254 (максимум по стандарту), пароль 8–128. Вынесены в константы, чтобы число было записано в одном месте и использовалось и в проверке, и в тексте ошибки.
- **стр. 12** — `isString(value)` — возвращает `true`, если значение — строка. `typeof value` даёт тип: `'string'`, `'number'`, `'object'`, `'undefined'`… Зачем: злоумышленник может прислать вместо строки объект (`{"email": {"$gt": ""}}`) — такая проверка его отсечёт.
- **стр. 14** — `fail(res, message)` — короткий помощник: ответить кодом 400 и текстом. Возвращает результат `res.status(...).send(...)`, поэтому в функциях ниже пишут `return fail(...)` — ответить и выйти.
- **стр. 17** — `checkEmail(email)` — привести почту к чистому виду и проверить.
- **стр. 18** — `trim()` убирает пробелы по краям, `toLowerCase()` — в нижний регистр: `'  Anna@Mail.COM '` → `'anna@mail.com'`. Так одна почта, написанная по-разному, считается одной.
- **стр. 19** — две проверки через `||`: длиннее 254 символов **или** не подходит под шаблон (`EMAIL_RE.test(trimmed)` → `false`, с `!` → `true`). Тогда вернуть `null` — «почта плохая».
- **стр. 20** — всё хорошо — вернуть очищенную почту.

### Функция `validateSignup` (стр. 24–49)

```js
23 // Validate the signup form
24 const validateSignup = (req, res, next) => {
25   const { name, email, password } = req.body;
26
27   if (!isString(name) || !isString(email) || !isString(password)) {
28     return fail(res, 'Invalid data format');
29   }
30
31   const trimmedName = name.trim();
32   if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
33     return fail(res, `Name must be between ${NAME_MIN} and ${NAME_MAX} characters`);
34   }
35
36   const cleanEmail = checkEmail(email);
37   if (!cleanEmail) {
38     return fail(res, 'Invalid email');
39   }
40
41   if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
42     return fail(res, `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`);
43   }
44
45   // The controller receives the cleaned values.
46   req.body.name = trimmedName;
47   req.body.email = cleanEmail;
48   next();
49 };
```

- **Кто вызывает:** `authRoute.js` стр. 8, перед `signup`: `router.post('/signup', validateSignup, signup)`.
- **стр. 24** — middleware: `(req, res, next)`.
- **стр. 25** — достаём из тела запроса имя, почту и пароль (деструктуризация, то же что `const name = req.body.name;` и т. д.).
- **стр. 27–29** — все три должны быть строками. Если хоть одно не строка (не прислали — `undefined`, прислали число или объект) — 400 «Invalid data format» и выйти.
- **стр. 31** — имя без пробелов по краям.
- **стр. 32–34** — длина имени меньше 2 или больше 60 — 400. Текст ошибки собран шаблонной строкой: `` `Name must be between ${NAME_MIN} and ${NAME_MAX} characters` `` → `'Name must be between 2 and 60 characters'`.
- **стр. 36** — проверяем почту помощником со стр. 17: получаем чистую почту или `null`.
- **стр. 37–39** — `null` — 400 «Invalid email».
- **стр. 41–43** — длина пароля меньше 8 или больше 128 — 400. Верхняя граница нужна, потому что bcrypt на очень длинных строках работает медленно — этим можно нагрузить сервер.
- **стр. 46–47** — записываем очищенные имя и почту обратно в `req.body`. Контроллер `signup` получит уже чистые данные. (Пароль не трогаем — пробелы в пароле могут быть нарочно.)
- **стр. 48** — всё хорошо — `next()`, дальше в `signup`.

### Функция `validateSignin` (стр. 52–67)

```js
51 // Validate the signin form
52 const validateSignin = (req, res, next) => {
53   const { email, password } = req.body;
54
55   if (!isString(email) || !isString(password)) {
56     return fail(res, 'Invalid data format');
57   }
58   if (!email.trim() || !password) {
59     return fail(res, 'Email and password are required');
60   }
61   if (password.length > PASSWORD_MAX) {
62     return fail(res, 'Invalid data format');
63   }
64
65   req.body.email = email.trim().toLowerCase();
66   next();
67 };
68
69 module.exports = {
70   validateSignup,
71   validateSignin
72 };
```

- **Кто вызывает:** `authRoute.js` стр. 9, перед `signin`.
- **стр. 53** — почта и пароль из тела запроса.
- **стр. 55–57** — оба должны быть строками, иначе 400.
- **стр. 58–60** — почта из одних пробелов (`email.trim()` даёт `''`, `!''` → `true`) или пустой пароль — 400 «Email and password are required».
- **стр. 61–63** — пароль длиннее 128 — 400 (та же защита bcrypt, что при регистрации). Формат почты при входе не проверяем: если почта неверная, такого пользователя просто не найдут.
- **стр. 65** — приводим почту к нижнему регистру без пробелов — так же, как её сохранили при регистрации, иначе `Anna@Mail.com` не нашлась бы.
- **стр. 66** — `next()` — дальше в `signin`.
- **стр. 69–72** — отдаём обе функции наружу.

# Часть 4. Сервер: отправка писем

## 4.1 back/utils/email.js — функция `sendMail`

**Что это за файл.** Единственное место, которое отправляет письма: ссылку «сброс пароля», чек покупателю и отчёт менеджеру. Письма уходят через сервис Resend.
**Кто подключает:** `AuthController.js` (стр. 5, письмо «сброс пароля»), `OrderController.js` (стр. 5, письма о заказе).
**Что подключает:** библиотеку `resend` (стр. 1).

**Почему Resend, а не Gmail.** Отправка через Gmail по SMTP требует платного аккаунта на своём домене. Resend отправляет письма через свой HTTPS-API: сервер просто делает запрос к Resend с ключом, никакой почтовый порт открывать не нужно.

```js
1  const { Resend } = require('resend');
2
3  // One mail sender for the whole project: order confirmations and the
4  // "forgot password" link both go through here.
5  //
6  // Resend is used instead of an SMTP mailbox because Gmail needs a paid
7  // workspace on a real domain, and this project has neither. Resend sends
8  // over its own HTTPS API, so no SMTP port has to be open on the host.
9  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
10
11 // Until a domain of our own is verified in Resend, mail may only be sent
12 // from their shared test address, and only to the address that owns the
13 // Resend account. With a verified domain this becomes info@<domain>.
14 const FROM = process.env.MAIL_FROM || "DARIN'S HANDMADE <onboarding@resend.dev>";
```

- **стр. 1** — из библиотеки `resend` берём класс `Resend` (фигурные скобки — достать по имени).
- **стр. 9** — создаём «отправителя» — но только если есть ключ. Тернарный оператор `условие ? да : нет`:
  - если в `.env` / на Render задан `RESEND_API_KEY` — `new Resend(ключ)` создаёт объект для работы с Resend;
  - если ключа нет — `null`.
- **стр. 14** — от кого письмо. `process.env.MAIL_FROM || '...'` — адрес из настроек, а если его нет — запасной: общий тестовый адрес Resend `onboarding@resend.dev` с подписью `DARIN'S HANDMADE`. Пока свой домен не подтверждён в Resend, с тестового адреса письма доходят **только на почту владельца аккаунта Resend**.

### Функция `sendMail({ to, subject, html })` (стр. 16–33)

```js
16 const sendMail = async ({ to, subject, html }) => {
17   // No key on this machine: write the letter to the console instead of
18   // failing, so the site keeps working in development.
19   if (!resend) {
20     console.log(`[email skipped - no RESEND_API_KEY] "${subject}" -> ${to}`);
21     return;
22   }
23
24   // The SDK does not throw on a rejected message; it reports the problem
25   // in the error field, so it has to be checked by hand.
26   const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
27
28   if (error) {
29     throw new Error(error.message || 'Resend refused the message');
30   }
31
32   return data;
33 };
34
35 module.exports = { sendMail };
```

- **Кто вызывает:** `forgotPassword` (AuthController, стр. 114), `sendCustomerReceipt` и `sendManagerReport` (OrderController, стр. 262 и 276).
- **Получает:** один объект с тремя полями: `to` — кому, `subject` — тема, `html` — текст письма в HTML. **Возвращает:** данные от Resend (id письма) или бросает ошибку.
- **стр. 16** — `({ to, subject, html })` — деструктуризация прямо в параметрах: функцию вызывают с объектом `sendMail({ to: 'a@b.c', subject: '...', html: '...' })`, а внутри сразу есть три переменные. `async` — внутри будет `await`.
- **стр. 19** — отправителя нет (ключ не задан, стр. 9)…
- **стр. 20** — …тогда вместо отправки пишем в консоль сервера `[email skipped - no RESEND_API_KEY] "тема" -> кому`. Так сайт работает и на компьютере разработчика без ключа.
- **стр. 21** — `return` — выйти, ничего не отправляя. Ошибки нет — для того, кто вызвал, это выглядит как успешная отправка.
- **стр. 26** — отправка: `resend.emails.send({ from, to, subject, html })` делает запрос к серверу Resend. `from: FROM` — отправитель со стр. 14. `await` ждёт ответа. Ответ — объект с двумя полями, и мы сразу их достаём (деструктуризация): `data` — сведения об отправленном письме (если всё хорошо), `error` — описание проблемы (если Resend отказал).
- **стр. 28** — Resend отказал (`error` не пустой). Важно: библиотека Resend при отказе **не бросает** ошибку сама — она возвращает её в поле `error`. Поэтому проверяем вручную.
- **стр. 29** — `throw new Error(...)` — сами бросаем ошибку, чтобы тот, кто вызвал `sendMail`, мог поймать её своим `try/catch`. `new Error(текст)` создаёт объект ошибки, текст попадает в его свойство `message`. Текст — `error.message` от Resend (например `'API key is invalid'`), а если его нет — `'Resend refused the message'`.
- **стр. 32** — всё хорошо — возвращаем `data`.
- **стр. 35** — отдаём наружу объект с одной функцией: `module.exports = { sendMail }`. Поэтому подключают так: `const { sendMail } = require('../utils/email');`.

# Часть 5. Сервер: маршруты (какой адрес какую функцию вызывает)

**Общее.** `express.Router()` создаёт отдельный «мини-сервер» для группы адресов. Метод `router.get/post/put/patch/delete(адрес, функция1, функция2, ..., контроллер)` — на этот метод и адрес выполнить функции **слева направо**. Всё между адресом и последней функцией — middleware. Префикс (например `/api/auth`) добавляется в `index.js`.

`:id`, `:productId`, `:sessionId` в адресе — **параметры**: часть адреса, которая может быть любой. Контроллер получает её в `req.params.id` и т.п.

## 5.1 back/routes/authRoute.js — вход и регистрация (`/api/auth`)

**Кто подключает:** `index.js` (стр. 10, подключён на стр. 64 к приставке `/api/auth`).

```js
1  const express = require('express');
2  const { signup, signin, forgotPassword, resetPassword, getMe } = require('../controllers/AuthController');
3  const { validateSignup, validateSignin } = require('../middleware/validate');
4  const protect = require('../middleware/authMiddleware');
5
6  const router = express.Router();
7
8  router.post('/signup', validateSignup, signup);
9  router.post('/signin', validateSignin, signin);
10
11 // Password reset: the first route emails a link, the second one uses it.
12 router.post('/forgot-password', forgotPassword);
13 router.post('/reset-password', resetPassword);
14
15 // protect runs first and puts the logged in user on req.user.
16 router.get('/me', protect, getMe);
17
18 module.exports = router;
```

- **стр. 1** — Express (нужен для `express.Router()`).
- **стр. 2** — пять функций-обработчиков из `AuthController.js` (деструктуризация: достать из объекта по именам).
- **стр. 3** — две проверки форм из `validate.js`.
- **стр. 4** — `protect` — проверка входа.
- **стр. 6** — `express.Router()` создаёт «мини-приложение» для одного раздела. У него те же методы, что у `app`: `router.get`, `router.post`... Адреса внутри пишутся **без** приставки `/api/auth` — её добавляет `index.js`.
- **стр. 8** — `router.post('/signup', validateSignup, signup)` — на `POST /api/auth/signup` выполнить по очереди: `validateSignup` (проверить форму; если плохо — она сама ответит 400 и не вызовет `next()`), потом `signup` (создать пользователя). Фронт: `LoginPage`, вкладка Sign Up.
- **стр. 9** — `POST /api/auth/signin` — `validateSignin`, потом `signin` (вход). Фронт: `LoginPage`, вкладка Sign In.
- **стр. 12** — `POST /api/auth/forgot-password` → `forgotPassword` (отправить ссылку на почту). Без проверки входа — человек как раз не может войти. Фронт: `ForgotPasswordPage`.
- **стр. 13** — `POST /api/auth/reset-password` → `resetPassword` (поставить новый пароль по ссылке). Фронт: `ResetPasswordPage`.
- **стр. 16** — `GET /api/auth/me` → сначала `protect` (проверить токен и положить пользователя в `req.user`), потом `getMe` (отдать его). Фронт: `App.jsx` — при каждом открытии сайта, чтобы узнать, кто вошёл.
- **стр. 18** — отдаём роутер наружу.

## 5.2 back/routes/productsRoute.js — товары (`/api/products`)

**Кто подключает:** `index.js` (стр. 9, подключён на стр. 63 к приставке `/api/products`).

```js
1  const express = require('express');
2  const {
3    createProduct,
4    getAllProducts,
5    getProductById,
6    updateProduct,
7    deleteProduct
8  } = require('../controllers/ProductController');
9  const protect = require('../middleware/authMiddleware');
10 const restrictTo = require('../middleware/roleMiddleware');
11 const upload = require('../middleware/upload');
12
13 const router = express.Router();
14
15 // Anyone may read the catalog.
16 router.get('/', getAllProducts);
17 router.get('/:id', getProductById);
18
19 // Adding, editing and deleting a product is for the manager only.
20 // upload.single('image') reads the picture out of the form.
21 router.post('/', protect, restrictTo('manager', 'admin'), upload.single('image'), createProduct);
22 router.put('/:id', protect, restrictTo('manager', 'admin'), upload.single('image'), updateProduct);
23 router.delete('/:id', protect, restrictTo('manager', 'admin'), deleteProduct);
24
25 module.exports = router;
```

- **стр. 2–8** — пять обработчиков из `ProductController.js`. Запись на несколько строк — то же самое, что в одну.
- **стр. 9** — `protect` — проверка входа.
- **стр. 10** — `restrictTo` — проверка роли.
- **стр. 11** — `upload` — настроенный multer (загрузка картинки).
- **стр. 13** — свой роутер для товаров.
- **стр. 16** — `GET /api/products` → `getAllProducts`. Без защиты — каталог видят все. Фронт: `BeadedBagsPage`, `BraceletsPage`, `ManagerProductsPage`.
- **стр. 17** — `GET /api/products/:id` → `getProductById`. `:id` — переменная часть адреса: для `/api/products/65f1bbb` в контроллере будет `req.params.id = '65f1bbb'`. Фронт: `ProductDetailPage`.
- **стр. 21** — `POST /api/products` (создать товар). Цепочка выполняется слева направо, каждая функция пропускает дальше только если всё хорошо:
  1. `protect` — вошёл ли (иначе 401);
  2. `restrictTo('manager', 'admin')` — менеджер ли (иначе 403);
  3. `upload.single('image')` — забрать из формы файл из поля `image`, сохранить на диск, положить сведения в `req.file`, а текстовые поля — в `req.body`;
  4. `createProduct` — сохранить товар в базе.
  - Порядок важен: картинка сохраняется на диск только **после** проверки прав — чужой не сможет засорить диск.
- **стр. 22** — `PUT /api/products/:id` — та же цепочка, в конце `updateProduct`. Картинку можно не присылать — тогда `req.file` пустой и старая картинка остаётся.
- **стр. 23** — `DELETE /api/products/:id` — `protect`, `restrictTo`, `deleteProduct`. Без `upload` — файл не нужен.
- **стр. 25** — отдаём роутер наружу.

## 5.3 back/routes/cartRoute.js — корзина (`/api/cart`)

**Кто подключает:** `index.js` (стр. 11, подключён на стр. 65 к приставке `/api/cart`).

```js
1  const express = require('express');
2  const { getCart, addToCart, removeFromCart, updateQuantity, clearCart } = require('../controllers/CartController');
3  const protect = require('../middleware/authMiddleware');
4
5  const router = express.Router();
6
7  // The cart always belongs to the logged in user, so every route is protected.
8  router.get('/', protect, getCart);
9  router.post('/', protect, addToCart);
10 router.patch('/:productId', protect, updateQuantity);
11 router.delete('/:productId', protect, removeFromCart);
12 router.delete('/', protect, clearCart);
13
14 module.exports = router;
```

- **стр. 2** — пять обработчиков из `CartController.js`.
- **стр. 3** — `protect`.
- **стр. 5** — свой роутер.
- **стр. 8–12** — у **каждого** адреса первым стоит `protect`: корзина в базе принадлежит вошедшему пользователю, и `protect` кладёт его id в `req.user` (без этого контроллер не знал бы, чью корзину брать). Гость сюда не ходит — его корзина живёт в браузере.
  - **стр. 8** — `GET /api/cart` → `getCart` (показать корзину);
  - **стр. 9** — `POST /api/cart` → `addToCart` (добавить товар, id в теле);
  - **стр. 10** — `PATCH /api/cart/:productId` → `updateQuantity` (поменять количество). `PATCH` — метод HTTP «изменить часть»;
  - **стр. 11** — `DELETE /api/cart/:productId` → `removeFromCart` (удалить один товар);
  - **стр. 12** — `DELETE /api/cart` → `clearCart` (очистить всё). Адрес без `:productId` — поэтому Express не путает его со стр. 11.
- **стр. 14** — отдаём роутер наружу.

## 5.4 back/routes/ordersRoute.js — заказы (`/api/orders`)

**Кто подключает:** `index.js` (стр. 12, подключён на стр. 66 к приставке `/api/orders`).

```js
1  const express = require('express');
2  const router = express.Router();
3  const {
4    createCheckoutSession,
5    getOrderBySession,
6    getAllOrders,
7    getOrderById,
8    updateOrderStatus,
9    getStats,
10 } = require('../controllers/OrderController');
11 const protect = require('../middleware/authMiddleware');
12 const restrictTo = require('../middleware/roleMiddleware');
13
14 // Reports and status changes are for the manager only.
15 const manager = [protect, restrictTo('manager', 'admin')];
16
17 // A guest may order too, so starting the payment is open to everyone.
18 router.post('/checkout-session', createCheckoutSession);
19 router.get('/by-session/:sessionId', getOrderBySession);
20
21 router.get('/', manager, getAllOrders);
22 router.get('/stats', manager, getStats);
23 router.patch('/:id/status', manager, updateOrderStatus);
24 router.get('/:id', manager, getOrderById);
25
26 module.exports = router;
```

- **стр. 2** — свой роутер (здесь он создан сразу, до подключения контроллера — порядок не важен).
- **стр. 3–10** — шесть обработчиков из `OrderController.js`. (Седьмой — `stripeWebhook` — подключён прямо в `index.js`, стр. 25, потому что ему нужно «сырое» тело запроса.)
- **стр. 11–12** — `protect` и `restrictTo`.
- **стр. 15** — `manager` — массив из двух middleware: `[protect, restrictTo('manager', 'admin')]`. Express понимает массив функций в маршруте так же, как перечисление через запятую. Записано один раз, чтобы не повторять в четырёх строках.
- **стр. 18** — `POST /api/orders/checkout-session` → `createCheckoutSession`. **Без защиты** — купить может и гость. Фронт: `CheckoutPage`.
- **стр. 19** — `GET /api/orders/by-session/:sessionId` → `getOrderBySession`. Тоже без защиты: Stripe возвращает покупателя на страницу «Спасибо» с id сессии в адресе. Фронт: `OrderSuccessPage`.
- **стр. 21** — `GET /api/orders` → только менеджер, `getAllOrders` (список заказов). Фронт: `ManagerOrdersPage`.
- **стр. 22** — `GET /api/orders/stats` → только менеджер, `getStats` (статистика продаж).
- **стр. 23** — `PATCH /api/orders/:id/status` → только менеджер, `updateOrderStatus` (сменить статус).
- **стр. 24** — `GET /api/orders/:id` → только менеджер, `getOrderById` (один заказ).
  - Эта строка стоит **после** `/stats` намеренно. Express проверяет маршруты сверху вниз. Если бы `/:id` стоял выше, запрос `GET /api/orders/stats` попал бы в него с `id = 'stats'`.
- **стр. 26** — отдаём роутер наружу.

# Часть 6. Сервер: контроллеры (что делает каждый адрес)

**Общее для всех контроллеров.** Контроллер — функция `async (req, res) => {...}`. Она вызывается последней в цепочке роутера. Почти каждая устроена одинаково:

```js
const имя = async (req, res) => {
  try {
    // 1. достать данные из req.body / req.params / req.query / req.user
    // 2. проверить их, при ошибке — return res.status(400 или 404).send({ message })
    // 3. обратиться к базе через модель (await Модель.метод(...))
    // 4. ответить res.status(200 или 201).json({ data: ... })
  } catch (error) {
    console.log(error.message);              // ошибку видно в логах сервера
    res.status(500).send({ message: ... });  // клиент получает 500
  }
};
```

Строки `try {`, `} catch (error) {`, `console.log(error.message);` и `res.status(500)...` есть в каждой функции. Ниже они не расписываются заново каждый раз — смысл всегда такой: «если что-то упало (например, база недоступна) — записать причину в консоль и ответить 500».

## 6.1 back/controllers/AuthController.js — регистрация, вход, пароль

**Что это за файл.** Всё про аккаунт: регистрация, вход, «забыли пароль», новый пароль по ссылке, «кто я».
**Кто подключает:** `authRoute.js` (стр. 2).
**Что подключает:** `bcryptjs` (стр. 1, хеш паролей), `jsonwebtoken` (стр. 2, токены), встроенный `crypto` (стр. 3, случайные токены и хеш SHA-256), модель `User` (стр. 4), `sendMail` (стр. 5).

### Константа и вспомогательные функции (стр. 7–38)

```js
1  const bcrypt = require('bcryptjs');
2  const jwt = require('jsonwebtoken');
3  const crypto = require('crypto');
4  const User = require('../models/userModel.js');
5  const { sendMail } = require('../utils/email');
6
7  // How long a password reset link stays valid.
8  const RESET_MINUTES = 60;
9
10 // The link we email is the raw token, but only its hash is saved. Someone
11 // who reads the database still cannot build a working link.
12 const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');
13
14 // Blocks asking for a second link within two minutes of the first one.
15 const sentRecently = (user) => {
16   if (!user.resetPasswordExpires) return false;
17   const issuedAt = new Date(user.resetPasswordExpires).getTime() - RESET_MINUTES * 60 * 1000;
18   return Date.now() - issuedAt < 2 * 60 * 1000;
19 };
```

- **стр. 1** — `bcryptjs` — библиотека для паролей. `bcrypt.hash` превращает пароль в хеш (строку, из которой пароль обратно не получить), `bcrypt.compare` проверяет, подходит ли пароль к хешу.
- **стр. 2** — `jsonwebtoken` — создаёт токен входа (`jwt.sign`).
- **стр. 3** — `crypto` — встроенный модуль Node (устанавливать не надо): случайные байты и хеш-функции.
- **стр. 4** — модель `User`.
- **стр. 5** — функция отправки письма.
- **стр. 8** — ссылка для сброса пароля действует 60 минут. Число записано в одном месте и используется дальше в двух функциях.
- **стр. 12** — `hashToken(raw)` — хеш строки по алгоритму SHA-256. По шагам:
  - `crypto.createHash('sha256')` — создать «хешер» SHA-256;
  - `.update(raw)` — дать ему строку;
  - `.digest('hex')` — получить результат в виде строки из 64 шестнадцатеричных символов (`'9f86d081...'`).
  - Одна и та же строка всегда даёт один и тот же хеш, но по хешу строку не восстановить. Зачем: в письмо уходит **сам токен**, а в базу — **только его хеш**. Даже тот, кто прочитает базу, не сможет собрать рабочую ссылку.
- **стр. 15** — `sentRecently(user)` — «просили ли ссылку меньше 2 минут назад». Защита от того, чтобы кнопкой «забыли пароль» засыпать человека письмами.
- **стр. 16** — `resetPasswordExpires` пустое (ссылку ещё не просили или уже использовали) — значит, точно не недавно: `false`.
- **стр. 17** — когда отправили прошлую ссылку. В базе хранится не время отправки, а время окончания: отправка + 60 минут. Значит, время отправки = окончание − 60 минут.
  - `new Date(...)` — превратить значение в дату; `.getTime()` — в число миллисекунд.
  - `RESET_MINUTES * 60 * 1000` — 60 минут в миллисекундах.
  - Пример: окончание 15:00 → отправили в 14:00.
- **стр. 18** — `Date.now() - issuedAt` — сколько прошло с отправки (в миллисекундах). Если меньше `2 * 60 * 1000` (2 минуты) — `true`, «слишком рано».

```js
21 // Builds the JWT. The details inside it are what the client gets back,
22 // and the secret is what proves the token came from our server.
23 const createToken = (user) => {
24   return jwt.sign(
25     { id: user._id, name: user.name, email: user.email, role: user.role },
26     process.env.JWT_SECRET,
27     { expiresIn: '1h' }
28   );
29 };
30
31 // The user details we are willing to send to the client (never the password).
32 const publicUser = (user) => ({
33   id: user._id,
34   name: user.name,
35   email: user.email,
36   avatar: user.avatar,
37   role: user.role
38 });
```

- **стр. 23** — `createToken(user)` — создать токен входа.
- **стр. 24** — `jwt.sign(данные, секрет, настройки)`:
  - **стр. 25** — что записать внутрь токена: id, имя, почта, роль. Пароль — никогда. `user._id` — id документа в MongoDB.
  - **стр. 26** — секрет из `.env`. Им токен подписывается; без секрета подделать подпись нельзя. Тот же секрет проверяет `protect` (`jwt.verify`).
  - **стр. 27** — `expiresIn: '1h'` — токен действует 1 час, потом нужно войти заново.
  - Результат — строка вида `eyJhbGciOi...`, её возвращаем.
- **стр. 32** — `publicUser(user)` — что о пользователе можно отправить на фронт. Стрелочная функция с объектом в круглых скобках `=> ({ ... })` сразу возвращает этот объект (без скобок `{` читалась бы как начало тела функции).
- **стр. 33–37** — только безопасные поля: `id`, `name`, `email`, `avatar`, `role`. Без пароля и без полей сброса.

### Функция `signup` — регистрация (стр. 41–64)

- **Кто вызывает:** `authRoute.js` стр. 8, `POST /api/auth/signup`, после `validateSignup`. С фронта — `LoginPage.jsx`, вкладка Sign Up.
- **Получает:** `{ name, email, password, avatar? }` — уже проверенные и очищенные `validateSignup`.
- **Возвращает:** 201 и `{ token, user }`.

```js
40 // Sign up
41 const signup = async (req, res) => {
42   try {
43     const { name, email, password, avatar } = req.body;
44
45     const exists = await User.findOne({ email });
46
47     if (exists) {
48       return res.status(400).send({ message: 'Email already exists' });
49     }
50
51     // The password is never stored as it was typed, only its hash.
52
53     const hashed = await bcrypt.hash(password, 10);
54
55     const user = await User.create({ name, email, password: hashed, avatar: avatar || '' });
56
57     const token = createToken(user);
58     res.status(201).json({ token, user: publicUser(user) });
59
60   } catch (error) {
61     console.log(error.message);
62     res.status(500).send({ message: error.message });
63   }
64 };
```

- **стр. 43** — достаём поля из тела запроса (деструктуризация). `avatar` может не прийти — тогда `undefined`.
- **стр. 45** — `User.findOne({ email })` — ищем пользователя с такой почтой. `{ email }` — короткая запись `{ email: email }`. Результат — документ или `null`.
- **стр. 47–49** — нашёлся — почта занята: 400 и выйти (`return`).
- **стр. 53** — `bcrypt.hash(password, 10)` — превратить пароль в хеш. `10` — «стоимость»: сколько раз bcrypt прогоняет вычисление (2¹⁰ раз). Чем больше, тем медленнее подбирать пароль перебором. Результат — строка вида `$2a$10$N9qo8uLO...` (в ней же записана «соль» — случайная добавка, поэтому у двух людей с одинаковым паролем хеши разные). `await` — hash работает асинхронно.
- **стр. 55** — `User.create({...})` — создать документ в коллекции `users` и вернуть его.
  - `password: hashed` — в базу кладём **хеш**, а не пароль;
  - `avatar: avatar || ''` — если аватар не прислали, пустая строка;
  - `role` не передаём вообще — схема поставит `'user'` по умолчанию. Даже если злоумышленник пришлёт `role: 'manager'`, мы это поле не берём (стр. 43 его не достаёт).
- **стр. 57** — сразу выдаём токен, чтобы после регистрации не нужно было входить отдельно.
- **стр. 58** — 201 («создано») и объект `{ token, user }`; `user` — через `publicUser`, без пароля. Фронт сохранит токен в `localStorage`.
- **стр. 60–63** — `catch`: ошибка (например, база недоступна) — в консоль и 500.

### Функция `signin` — вход (стр. 67–91)

- **Кто вызывает:** `authRoute.js` стр. 9, `POST /api/auth/signin`, после `validateSignin`. С фронта — `LoginPage.jsx`.
- **Получает:** `{ email, password }`. **Возвращает:** 200 и `{ token, user }`.

```js
66 // Sign in
67 const signin = async (req, res) => {
68   try {
69     const { email, password } = req.body;
70
71     // select('+password') is needed because the model hides the password.
72     const user = await User.findOne({ email }).select('+password');
73
74     if (!user) {
75       return res.status(400).send({ message: 'Invalid credentials' });
76     }
77
78     // compare() hashes the typed password and checks it against the stored hash.
79     const isMatch = await bcrypt.compare(password, user.password);
80
81     if (!isMatch) {
82       return res.status(400).send({ message: 'Invalid credentials' });
83     }
84
85     const token = createToken(user);
86     res.status(200).json({ token, user: publicUser(user) });
87   } catch (error) {
88     console.log(error.message);
89     res.status(500).send({ message: error.message });
90   }
91 };
```

- **стр. 69** — почта и пароль из тела запроса.
- **стр. 72** — ищем пользователя по почте. В модели у пароля стоит `select: false` — обычный запрос его не возвращает. `.select('+password')` — «добавь к обычным полям ещё и скрытый `password`» (`+` — добавить). Хеш нужен для проверки на стр. 79.
- **стр. 74–76** — пользователя нет — 400 «Invalid credentials» (неверные данные).
- **стр. 79** — `bcrypt.compare(введённый, хеш)` — берёт соль из хеша, хеширует введённый пароль так же и сравнивает. Результат — `true` или `false`.
- **стр. 81–83** — не подошёл — **тот же самый** ответ, что на стр. 75. Специально: по ответу нельзя понять, существует ли такая почта.
- **стр. 85** — всё верно — создаём токен.
- **стр. 86** — 200 и `{ token, user }`.
- **стр. 87–90** — `catch` — 500.

### Функция `forgotPassword` — отправить ссылку для сброса (стр. 94–141)

- **Кто вызывает:** `authRoute.js` стр. 12, `POST /api/auth/forgot-password`. Фронт: `ForgotPasswordPage.jsx`.
- **Получает:** `{ email }`. **Возвращает:** всегда 200 с одним и тем же текстом.

```js
93  // Forgot password - send the reset link
94  const forgotPassword = async (req, res) => {
95    try {
96      const { email } = req.body;
97      if (!email) {
98        return res.status(400).send({ message: 'Email is required' });
99      }
100
101     const user = await User.findOne({ email: String(email).trim().toLowerCase() })
102       .select('+resetPasswordExpires');
103
104     if (user && !sentRecently(user)) {
105       const rawToken = crypto.randomBytes(32).toString('hex');
106       user.resetPasswordToken = hashToken(rawToken);
107       user.resetPasswordExpires = Date.now() + RESET_MINUTES * 60 * 1000;
108       await user.save();
109
110       const base = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
111       const resetUrl = `${base}/reset-password?token=${rawToken}`;
112
```

- **стр. 96** — почта из тела.
- **стр. 97–99** — почты нет — 400.
- **стр. 101** — ищем пользователя. Почту приводим к виду, в котором её сохранили: `String(email)` — на случай, если прислали не строку; `.trim()` — убрать пробелы; `.toLowerCase()` — нижний регистр.
- **стр. 102** — `.select('+resetPasswordExpires')` — это поле в модели скрыто (`select: false`), а оно нужно `sentRecently` на стр. 104.
- **стр. 104** — отправляем ссылку, только если пользователь нашёлся (`user` не `null`) **и** (`&&`) ссылку не просили последние 2 минуты (`!sentRecently(user)`).
- **стр. 105** — `crypto.randomBytes(32)` — 32 случайных байта; `.toString('hex')` — в строку из 64 символов. Это и есть токен для ссылки — угадать его невозможно.
- **стр. 106** — в базу кладём **хеш** токена (стр. 12).
- **стр. 107** — срок: сейчас (`Date.now()`, в миллисекундах) + 60 минут.
- **стр. 108** — сохраняем пользователя в базе.
- **стр. 110** — адрес сайта для ссылки. `||` берёт первое непустое: заголовок `origin` (адрес сайта, с которого пришёл запрос, его подставляет браузер), иначе `CLIENT_URL` из настроек, иначе локальный адрес.
- **стр. 111** — ссылка: `https://сайт/reset-password?token=<токен>`. В письмо идёт **сам** токен — его хеш потом сравнит `resetPassword`.

```js
113       try {
114         await sendMail({
115           to: user.email,
116           subject: "Reset your DARIN'S HANDMADE password",
117           html: `
118             <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
119               <h2 style="letter-spacing:2px">DARIN'S HANDMADE</h2>
120               <p>We received a request to reset your password.</p>
121               <p>Click the button below to choose a new one. This link expires in 1 hour.</p>
122               <p style="margin:28px 0">
123                 <a href="${resetUrl}" style="background:#050000;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;display:inline-block">Reset password</a>
124               </p>
125               <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
126               <p style="color:#999;font-size:12px;word-break:break-all">${resetUrl}</p>
127             </div>`
128         });
129       } catch (mailError) {
130         console.log(mailError.message);
131       }
132     }
133
134     // The same answer is sent whether the email exists or not, so nobody
135     // can use this form to find out who is registered on the site.
136     res.status(200).send({ message: 'If an account exists for that email, a reset link has been sent.' });
137   } catch (error) {
138     console.log(error.message);
139     res.status(500).send({ message: 'Could not process the request' });
140   }
141 };
```

- **стр. 113** — внутренний `try`: только для отправки письма.
- **стр. 114–128** — `sendMail({ to, subject, html })`: кому — почта пользователя, тема, текст письма в HTML (обратные кавычки — шаблонная строка, `${resetUrl}` подставляет ссылку). В письме кнопка-ссылка (стр. 123) и та же ссылка текстом (стр. 126) — на случай, если кнопка не отображается.
- **стр. 129–131** — `catch (mailError)`: письмо не ушло (нет ключа Resend, Resend отказал) — пишем причину в консоль и **не** падаем. Имя `mailError` придумано здесь: так назван объект ошибки, `mailError.message` — его текст.
- **стр. 136** — ответ 200 **всегда один и тот же**, нашлась почта или нет. Иначе через эту форму можно было бы проверять, кто зарегистрирован на сайте.
- **стр. 137–140** — внешний `catch` (например, упала база) — 500.

### Функция `resetPassword` — новый пароль по ссылке (стр. 144–171)

- **Кто вызывает:** `authRoute.js` стр. 13, `POST /api/auth/reset-password`. Фронт: `ResetPasswordPage.jsx` (берёт токен из адреса ссылки).
- **Получает:** `{ token, password }`.

```js
143 // Reset password - set the new one using the token from the link
144 const resetPassword = async (req, res) => {
145   try {
146     const { token, password } = req.body;
147     if (!token || typeof password !== 'string' || password.length < 8) {
148       return res.status(400).send({ message: 'Invalid token or password too short (min 8)' });
149     }
150
151     // The link is good only if the hash matches and the hour has not passed.
152     const user = await User.findOne({
153       resetPasswordToken: hashToken(token),
154       resetPasswordExpires: { $gt: Date.now() }
155     });
156
157     if (!user) {
158       return res.status(400).send({ message: 'Reset link is invalid or has expired' });
159     }
160
161     user.password = await bcrypt.hash(password, 10);
162     user.resetPasswordToken = null;
163     user.resetPasswordExpires = null;
164     await user.save();
165
166     res.status(200).send({ message: 'Password updated. You can now sign in.' });
167   } catch (error) {
168     console.log(error.message);
169     res.status(500).send({ message: error.message });
170   }
171 };
```

- **стр. 146** — токен из ссылки и новый пароль.
- **стр. 147** — три проверки через `||`: токена нет; пароль не строка (`typeof password !== 'string'`); пароль короче 8 символов. Любая верна — 400 (стр. 148).
- **стр. 152–155** — ищем пользователя, у которого **одновременно**:
  - `resetPasswordToken` равен хешу присланного токена (`hashToken(token)` — хешируем так же, как при сохранении, и сравниваем хеши);
  - `resetPasswordExpires: { $gt: Date.now() }` — срок окончания **больше** текущего времени, то есть ссылка ещё действует. `$gt` — оператор MongoDB «greater than», «больше чем» (как `>`).
  - Скрытые поля можно использовать в условии поиска — `select: false` запрещает только возвращать их.
- **стр. 157–159** — не нашли (токен неверный или час прошёл) — 400 «ссылка недействительна или истекла».
- **стр. 161** — новый пароль — тоже только хешем.
- **стр. 162–163** — стираем токен и срок: ссылка одноразовая.
- **стр. 164** — сохраняем.
- **стр. 166** — 200 «пароль обновлён, можно входить».
- **стр. 167–170** — `catch` — 500.

### Функция `getMe` — кто я (стр. 174–177)

```js
173 // Get the logged in user
174 const getMe = async (req, res) => {
175   // protect already checked the token and put the user on req.user.
176   res.status(200).json({ user: req.user });
177 };
178
179 module.exports = {
180   signup,
181   signin,
182   forgotPassword,
183   resetPassword,
184   getMe
185 };
```

- **Кто вызывает:** `authRoute.js` стр. 16, `GET /api/auth/me`, после `protect`. Фронт: `App.jsx` при открытии сайта.
- **стр. 176** — `protect` уже проверил токен и положил пользователя из базы в `req.user`. Просто отдаём его: 200 и `{ user }`. Без `try/catch` — здесь нечему падать.
- **стр. 179–185** — отдаём пять функций наружу.

## 6.2 back/controllers/ProductController.js — товары

**Что это за файл.** Работа с каталогом: создать, показать все, показать один, изменить, удалить товар. Плюс четыре помощника.
**Кто подключает:** `productsRoute.js` (стр. 2–8).
**Что подключает:** `path` (стр. 1, пути к файлам), `fs` (стр. 2, удаление файлов), модель `Product` (стр. 3).

### Функция `toArray(value)` (стр. 7–24)

```js
1  const path = require('path');
2  const fs = require('fs');
3  const Product = require('../models/productModel.js');
4
5  // The form sends color_palette / details / style as one string
6  // ("Pink, White"), so we turn it back into an array before saving.
7  const toArray = (value) => {
8    // Already an array: nothing to do.
9    if (Array.isArray(value)) {
10     return value;
11   }
12
13   // Not text either (for example undefined): an empty list.
14   if (typeof value !== 'string') {
15     return [];
16   }
17
18   // "Pink, White ," -> ["Pink", " White ", ""]
19   const parts = value.split(',');
20   // -> ["Pink", "White", ""]
21   const trimmed = parts.map((item) => item.trim());
22   // -> ["Pink", "White"]  (empty strings are dropped)
23   return trimmed.filter(Boolean);
24 };
```

- **Зачем:** форма в админке присылает цвета, особенности и стиль одной строкой: `"Pink, White"`. В базе это массивы (`color_palette: [String]`). Функция превращает строку в массив.
- **Кто вызывает:** `createProduct` (стр. 84–86) и `updateProduct` (стр. 137–139).
- **стр. 9–11** — `Array.isArray(value)` — встроенная проверка «это массив?». Если уже массив — вернуть как есть.
- **стр. 14–16** — `typeof value !== 'string'` — не строка (например, поле не прислали — `undefined`) — вернуть пустой массив.
- **стр. 19** — `split(',')` режет строку по запятым: `"Pink, White ,"` → `["Pink", " White ", ""]`.
- **стр. 21** — `map(функция)` строит новый массив, применяя функцию к каждому элементу. `item.trim()` убирает пробелы по краям → `["Pink", "White", ""]`.
- **стр. 23** — `filter(Boolean)` оставляет только «непустые» элементы. `Boolean('')` → `false`, `Boolean('Pink')` → `true`. Итог: `["Pink", "White"]`.

### Функция `parseStock(value)` (стр. 28–47)

```js
26 // The stock field arrives from the form as text. null means the manager
27 // left it empty, so this product is not stock tracked.
28 const parseStock = (value) => {
29   // Empty field: stock is not tracked for this product
30   if (value === undefined || value === null || String(value).trim() === '') {
31     return null;
32   }
33
34   const number = Math.floor(Number(value));
35
36   // Not a number (e.g. "abc"): also not tracked
37   if (!Number.isFinite(number)) {
38     return null;
39   }
40
41   // Stock can't be negative
42   if (number < 0) {
43     return 0;
44   }
45
46   return number;
47 };
```

- **Зачем:** поле «остаток» приходит из формы текстом. Нужно получить целое число от 0 или `null` («не отслеживаем остаток, товар всегда в наличии»).
- **Кто вызывает:** `createProduct` (стр. 87) и `updateProduct` (стр. 140).
- **стр. 30–32** — поле пустое — `null`. `||` — «или»: значение `undefined` (не прислали), `null`, или строка из одних пробелов (`String(value).trim()` даёт `''`).
- **стр. 34** — два действия, читать изнутри: `Number(value)` превращает в число (`"7.9"` → 7.9, `"abc"` → `NaN`); `Math.floor(...)` отрезает дробную часть вниз (7.9 → 7).
- **стр. 37–39** — `Number.isFinite(number)` — «это нормальное число?» (`NaN` и бесконечность — нет). `!` переворачивает: не число — вернуть `null`.
- **стр. 42–44** — отрицательного склада не бывает: `-3` → `0`.
- **стр. 46** — все проверки пройдены — вернуть число.
- Примеры: `"10"` → 10; `"7.9"` → 7; `"-3"` → 0; `""` → `null`; `"abc"` → `null`.

### Функция `buildFilePath(file)` (стр. 50–55)

```js
49 // Where the uploaded picture sits, for example "uploads/pink-123.jpg".
50 const buildFilePath = (file) => {
51   // On Windows path.join gives "uploads\pink-123.jpg" (backslash).
52   const filePath = path.join('uploads', file.filename);
53   // A web address needs "/", so every "\" is replaced with "/".
54   return filePath.replace(/\\/g, '/');
55 };
```

- **Зачем:** записать в базу путь к загруженной картинке.
- **Кто вызывает:** `createProduct` (стр. 80, 93) и `updateProduct` (стр. 145, 157).
- **Получает:** `file` — `req.file` от multer; `file.filename` — имя, которое придумал `upload.js` (`pink-bag-1718000000000.jpg`).
- **стр. 52** — `path.join('uploads', имя)` склеивает папку и имя. На Windows разделитель `\`: `uploads\pink-bag-1718...jpg`.
- **стр. 54** — `replace(/\\/g, '/')` — заменить все `\` на `/`. В регулярном выражении `\\` — это один символ `\`, `g` — все вхождения. Путь станет частью адреса в браузере, а там нужен `/`: `uploads/pink-bag-1718...jpg`.

### Функция `removeImageFile(fileName)` (стр. 58–67)

```js
57 // Deletes an old picture from the disk after the product was replaced or removed.
58 const removeImageFile = (fileName) => {
59   if (!fileName) {
60     return;
61   }
62
63   const fullPath = path.join(__dirname, '..', fileName);
64
65   // If the file is already gone, there is nothing to do, so the error is ignored.
66   fs.promises.unlink(fullPath).catch(() => {});
67 };
```

- **Зачем:** удалить картинку с диска — когда товар удалён, картинку заменили или товар не удалось сохранить.
- **Кто вызывает:** `createProduct` (стр. 93), `updateProduct` (стр. 154, 157), `deleteProduct` (стр. 171).
- **стр. 59–61** — имени нет — ничего не делаем.
- **стр. 63** — полный путь: `__dirname` (`back/controllers`) + `'..'` (на уровень вверх) + `'uploads/xxx.jpg'` → `back/uploads/xxx.jpg`.
- **стр. 66** — `fs.promises.unlink(путь)` — удалить файл. Возвращает Promise; мы его **не ждём** (`await` нет) — ответ клиенту не задерживается из-за удаления. `.catch(() => {})` — если файла уже нет, удаление вернёт ошибку; пустая функция её «проглатывает», иначе Node написал бы предупреждение о необработанной ошибке.

### Функция `createProduct` — создать товар (стр. 70–97)

- **Кто вызывает:** `productsRoute.js` стр. 21, `POST /api/products`, после `protect`, `restrictTo`, `upload.single('image')`. С фронта — `ManagerProductsPage.jsx`, кнопка Add Product.
- **Получает:** `req.file` (картинка от multer), `req.body` (текстовые поля формы — всё строками).

```js
69 // Create product
70 const createProduct = async (req, res) => {
71   try {
72     if (!req.file) {
73       return res.status(400).send({ message: 'Product image is required' });
74     }
75     if (!req.body.model_name || !req.body.category) {
76       return res.status(400).send({ message: 'Send required fields: model_name, category' });
77     }
78
79     const product = await Product.create({
80       file_name: buildFilePath(req.file),
81       model_name: req.body.model_name,
82       category: req.body.category,
83       price: req.body.price,
84       color_palette: toArray(req.body.color_palette),
85       details: toArray(req.body.details),
86       style: toArray(req.body.style),
87       stock: parseStock(req.body.stock)
88     });
89
90     res.status(201).json({ data: product });
91   } catch (error) {
92     // The product was not saved, so the uploaded picture is not needed.
93     if (req.file) removeImageFile(buildFilePath(req.file));
94     console.log(error.message);
95     res.status(400).send({ message: error.message });
96   }
97 };
```

- **стр. 72–74** — `req.file` пустой — картинку не прислали — 400 и выйти. (Поле `file_name` в модели обязательное.)
- **стр. 75–77** — нет названия **или** (`||`) категории — 400.
- **стр. 79** — `Product.create({...})` создаёт документ в коллекции `products` и возвращает его. `await` ждёт базу. По полям:
  - **стр. 80** — путь к картинке (`buildFilePath`);
  - **стр. 81** — название как пришло;
  - **стр. 82** — категория; Mongoose проверит, что это `'bags'` или `'bracelets'` (`enum`);
  - **стр. 83** — цена: из формы пришла строка `"120"`, Mongoose сам превратит её в число;
  - **стр. 84–86** — три списка через `toArray`;
  - **стр. 87** — остаток через `parseStock`.
- **стр. 90** — 201 («создано») и созданный товар.
- **стр. 91** — `catch`: сохранить не удалось (например, категория не из списка — Mongoose бросил ValidationError).
- **стр. 93** — картинка к этому моменту **уже лежит на диске** (её сохранил multer до контроллера). Товара нет — картинка не нужна, удаляем, чтобы не копился мусор. Запись `if (условие) действие;` в одну строку — то же самое, что с фигурными скобками.
- **стр. 94** — причина в консоль.
- **стр. 95** — 400 с текстом ошибки Mongoose: чаще всего это ошибка введённых данных, а не сервера.

### Функция `getAllProducts` — все товары (стр. 100–108)

```js
99  // Get all products
100 const getAllProducts = async (req, res) => {
101   try {
102     const products = await Product.find({});
103     res.status(200).json({ count: products.length, data: products });
104   } catch (error) {
105     console.log(error.message);
106     res.status(500).send({ message: error.message });
107   }
108 };
```

- **Кто вызывает:** `GET /api/products` (`productsRoute.js` стр. 16). Фронт: `BeadedBagsPage`, `BraceletsPage`, `ManagerProductsPage`.
- **стр. 102** — `Product.find({})` — все документы коллекции `products`. Пустой объект `{}` — «без условий». Результат — массив товаров.
- **стр. 103** — 200 и объект `{ count, data }`: `products.length` — сколько товаров, `data` — сам массив. Фронт берёт `response.data.data`.
- **стр. 104–107** — ошибка — 500.

### Функция `getProductById` — один товар (стр. 111–122)

```js
110 // Get product by ID
111 const getProductById = async (req, res) => {
112   try {
113     const product = await Product.findById(req.params.id);
114     if (!product) {
115       return res.status(404).send({ message: 'Product not found' });
116     }
117     res.status(200).json({ data: product });
118   } catch (error) {
119     console.log(error.message);
120     res.status(500).send({ message: error.message });
121   }
122 };
```

- **Кто вызывает:** `GET /api/products/:id` (`productsRoute.js` стр. 17). Фронт: `ProductDetailPage`.
- **стр. 113** — `req.params.id` — часть адреса после `/api/products/` (в роутере записана как `:id`). `Product.findById(id)` ищет документ с таким `_id`; нет — `null`.
- **стр. 114–116** — не найден — 404 «Product not found».
- **стр. 117** — 200 и товар.
- **стр. 118–121** — ошибка — 500. Сюда попадём, например, если id вообще не похож на id MongoDB (`/api/products/abc`): Mongoose не сможет его разобрать и бросит CastError.

### Функция `updateProduct` — изменить товар (стр. 125–161)

- **Кто вызывает:** `PUT /api/products/:id` (`productsRoute.js` стр. 22) после `protect`, `restrictTo`, `upload.single('image')`. Фронт: `ManagerProductsPage` — кнопка Save changes.

```js
124 // Update product
125 const updateProduct = async (req, res) => {
126   try {
127     const product = await Product.findById(req.params.id);
128     if (!product) {
129       return res.status(404).send({ message: 'Product not found' });
130     }
131
132     // Only the fields the manager actually filled in are changed.
133     const update = {};
134     if (req.body.model_name !== undefined) update.model_name = req.body.model_name;
135     if (req.body.category !== undefined) update.category = req.body.category;
136     if (req.body.price !== undefined) update.price = req.body.price;
137     if (req.body.color_palette !== undefined) update.color_palette = toArray(req.body.color_palette);
138     if (req.body.details !== undefined) update.details = toArray(req.body.details);
139     if (req.body.style !== undefined) update.style = toArray(req.body.style);
140     if (req.body.stock !== undefined) update.stock = parseStock(req.body.stock);
141
142     // A new picture was sent, so remember the old one and delete it afterwards.
143     let oldImage = null;
144     if (req.file) {
145       update.file_name = buildFilePath(req.file);
146       oldImage = product.file_name;
147     }
148
149     const result = await Product.findByIdAndUpdate(req.params.id, update, {
150       new: true,
151       runValidators: true
152     });
153
154     if (oldImage) removeImageFile(oldImage);
155     res.status(200).json({ data: result });
156   } catch (error) {
157     if (req.file) removeImageFile(buildFilePath(req.file));
158     console.log(error.message);
159     res.status(400).send({ message: error.message });
160   }
161 };
```

- **стр. 127** — сначала находим товар: нужен путь его старой картинки (стр. 146).
- **стр. 128–130** — нет такого — 404.
- **стр. 133** — `update` — пустой объект изменений. Будем добавлять в него только то, что прислали.
- **стр. 134–140** — семь одинаковых строк. Каждая: «если поле прислали (`!== undefined`), положить его в `update`». Например, если менеджер поменял только цену, в `update` окажется только `{ price: '150' }`, а остальные поля товара останутся как были. Списки идут через `toArray`, остаток — через `parseStock`.
- **стр. 143** — `oldImage` — путь старой картинки, пока `null`. `let` — может поменяться.
- **стр. 144** — пришла новая картинка (`req.file` не пустой)…
- **стр. 145** — …записываем в `update` её путь…
- **стр. 146** — …и запоминаем путь старой, чтобы удалить её после успешного обновления.
- **стр. 149–152** — `Product.findByIdAndUpdate(id, изменения, настройки)` — найти и обновить одним запросом. Настройки:
  - `new: true` — вернуть **обновлённый** документ (без этого вернулся бы старый, до изменений);
  - `runValidators: true` — проверить правила схемы (`enum` у категории, `min: 0` у остатка). По умолчанию Mongoose проверяет их только при создании, а при обновлении — нет.
- **стр. 154** — обновление прошло — удаляем старую картинку с диска (если её меняли).
- **стр. 155** — 200 и обновлённый товар.
- **стр. 156–157** — `catch`: обновление не прошло — удаляем только что загруженную **новую** картинку (старая остаётся у товара).
- **стр. 158–159** — причина в консоль и 400.

### Функция `deleteProduct` — удалить товар (стр. 164–177)

```js
163 // Delete product
164 const deleteProduct = async (req, res) => {
165   try {
166     const result = await Product.findByIdAndDelete(req.params.id);
167     if (!result) {
168       return res.status(404).send({ message: 'Product not found' });
169     }
170
171     removeImageFile(result.file_name);
172     res.status(200).send({ message: 'Product deleted successfully' });
173   } catch (error) {
174     console.log(error.message);
175     res.status(500).send({ message: error.message });
176   }
177 };
178
179 module.exports = {
180   createProduct,
181   getAllProducts,
182   getProductById,
183   updateProduct,
184   deleteProduct
185 };
```

- **Кто вызывает:** `DELETE /api/products/:id` (`productsRoute.js` стр. 23). Фронт: `ManagerProductsPage` — кнопка Delete.
- **стр. 166** — `findByIdAndDelete(id)` — найти и удалить. Возвращает **удалённый** документ, или `null`, если такого не было.
- **стр. 167–169** — `null` — удалять было нечего — 404.
- **стр. 171** — удаляем с диска картинку удалённого товара (`result.file_name`).
- **стр. 172** — 200 и сообщение.
- **стр. 173–176** — ошибка — 500.
- **стр. 179–185** — отдаём пять обработчиков наружу (помощники `toArray` и другие остаются внутри файла).

## 6.3 back/controllers/CartController.js — корзина вошедшего пользователя

**Что это за файл.** Пять функций-обработчиков для корзины, которая хранится в базе: показать, добавить товар, удалить товар, поменять количество, очистить. Плюс одна вспомогательная `loadCart`.
**Кто подключает:** `cartRoute.js` (стр. 2).
**Что подключает:** модель `Cart` (стр. 1).

**Откуда берётся `req.user.id`.** Все адреса корзины в `cartRoute.js` защищены middleware `protect`. Он проверяет токен входа и кладёт в `req.user` данные пользователя из базы: `req.user = { id, name, email, avatar, role }`. Поэтому в каждой функции ниже `req.user.id` — это id **того, кто вошёл**. Чужой id подставить нельзя: он берётся не из запроса, а из проверенного токена. Значит, человек работает **только со своей** корзиной.

**Общий шаблон каждого обработчика:**
```js
const имя = async (req, res) => {
  try {
    ...работа с базой...
    res.status(200).json({ data: ... });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};
```
- `async` — внутри можно писать `await`: ждать ответа базы, не останавливая сервер для других посетителей.
- `req` — запрос (что прислал браузер), `res` — ответ (что мы отправим назад).
- `try { ... } catch (error) { ... }` — если любая строка внутри `try` упадёт (база недоступна, неверный id и т. п.), выполнение перейдёт в `catch`. Там мы пишем текст ошибки в консоль сервера и отвечаем кодом **500** («ошибка на сервере»). Без `try/catch` сервер ответил бы непонятной ошибкой или запрос «повис» бы.
- `res.status(200)` — код ответа 200 «всё хорошо»; `.json({ data: ... })` — отправить объект в формате JSON. Фронт достаёт корзину из `response.data.data`.

### Функция `loadCart(cartId)` (стр. 5–9) — вспомогательная

```js
1 const Cart = require('../models/cartModel.js');
2
3 // Loads the cart with the full product details inside every item.
4 // A product that was deleted from the catalog is dropped from the list.
5 const loadCart = async (cartId) => {
6   const cart = await Cart.findById(cartId).populate('items.product');
7   cart.items = cart.items.filter((item) => item.product);
8   return cart;
9 };
```

- **Кто вызывает:** каждая функция этого файла перед ответом (стр. 21, 53, 76, 106).
- **Получает:** `cartId` — id корзины. **Возвращает:** корзину, в которой вместо id товаров лежат сами товары.
- **стр. 1** — подключаем модель `Cart` (коллекция `carts`).
- **стр. 5** — функция `loadCart`, `async` — внутри будет `await`.
- **стр. 6** — два действия подряд:
  - `Cart.findById(cartId)` — найти корзину по её `_id`;
  - `.populate('items.product')` — «подставить товары». В базе строка корзины выглядит так: `{ product: ObjectId('65f1...'), quantity: 2 }` — только id товара. `populate` смотрит в схему (`cartModel.js` стр. 16: `ref: 'Product'`), идёт в коллекцию `products`, находит товар с этим id и **кладёт вместо id весь документ товара**: `{ product: { _id: '65f1...', model_name: 'Pink Bag', price: 180, file_name: '...' }, quantity: 2 }`. Это как JOIN в SQL. Фронту так удобнее: сразу есть название, цена и картинка.
  - `await` — ждём, пока база ответит.
- **стр. 7** — если товар удалили из каталога, а в чьей-то корзине он остался, `populate` не найдёт его и поставит `null`: `{ product: null, quantity: 1 }`. `filter((item) => item.product)` строит новый массив и оставляет только строки, где `item.product` не пустой. `cart.items = ...` — заменяем список строк очищенным.
- **стр. 8** — возвращаем корзину.

### Функция `getCart` (стр. 12–26) — показать корзину

- **Кто вызывает:** `GET /api/cart` (`cartRoute.js` стр. 8). Фронт: `fetchCart` в `CartContext.jsx` — при входе и после каждого изменения.

```js
11 // Get the cart of the logged in user
12 const getCart = async (req, res) => {
13   try {
14     let cart = await Cart.findOne({ user: req.user.id });
15
16     // A user who never added anything yet has no cart, so create an empty one.
17     if (!cart) {
18       cart = await Cart.create({ user: req.user.id, items: [] });
19     }
20
21     res.status(200).json({ data: await loadCart(cart._id) });
22   } catch (error) {
23     console.log(error.message);
24     res.status(500).send({ message: error.message });
25   }
26 };
```

- **стр. 12** — обработчик `getCart(req, res)`.
- **стр. 14** — `Cart.findOne({ user: req.user.id })` — найти **одну** корзину, у которой поле `user` равно id вошедшего. Если такой нет — результат `null`. `let` (а не `const`), потому что на стр. 18 переменная может получить новое значение.
- **стр. 17** — `if (!cart)` — «если корзины нет». `!` переворачивает: `!null` → `true`.
- **стр. 18** — `Cart.create({ user: req.user.id, items: [] })` — создать в базе новую пустую корзину для этого пользователя и вернуть её. Так у человека, который ещё ничего не добавлял, всё равно будет корзина.
- **стр. 21** — `loadCart(cart._id)` — загрузить корзину с подставленными товарами (`_id` — id документа, его ставит MongoDB). `await` ждёт. Результат кладём в `{ data: ... }` и отвечаем кодом 200.
- **стр. 22–25** — ошибка — в консоль и ответ 500 (см. общий шаблон выше).

### Функция `addToCart` (стр. 29–58) — добавить товар

- **Кто вызывает:** `POST /api/cart` (`cartRoute.js` стр. 9). Фронт: `addToCart` в `CartContext.jsx` (кнопки Add to Cart) и перенос гостевой корзины при входе.
- **Получает:** в теле запроса `{ productId: '65f1bbb...' }` — id товара, который добавляют.

```js
28 // Add a product to the cart
29 const addToCart = async (req, res) => {
30   try {
31     const { productId } = req.body;
32     if (!productId) {
33       return res.status(400).send({ message: 'Send required field: productId' });
34     }
35
36     let cart = await Cart.findOne({ user: req.user.id });
37     if (!cart) {
38       cart = await Cart.create({ user: req.user.id, items: [] });
39     }
40
41     // Already in the cart, so only raise the quantity.
42     const index = cart.items.findIndex(
43       (item) => item.product && item.product.toString() === productId
44     );
45
46     if (index > -1) {
47       cart.items[index].quantity += 1;
48     } else {
49       cart.items.push({ product: productId, quantity: 1 });
50     }
51
52     await cart.save();
53     res.status(200).json({ data: await loadCart(cart._id) });
54   } catch (error) {
55     console.log(error.message);
56     res.status(500).send({ message: error.message });
57   }
58 };
```

- **стр. 29** — обработчик `addToCart(req, res)`.
- **стр. 30** — начало `try`: всё до стр. 53 выполняется «под защитой», ошибка уйдёт в `catch` на стр. 54.
- **стр. 31** — `const { productId } = req.body;` — достаём поле из тела запроса.
  - `req.body` — тело запроса, уже превращённое в объект (это сделал `express.json()` в `index.js`). Например, фронт прислал `{ "productId": "65f1bbb" }` — тогда `req.body` = `{ productId: '65f1bbb' }`.
  - Фигурные скобки слева — деструктуризация: «возьми из объекта поле `productId` и положи в переменную с тем же именем». Это то же самое, что `const productId = req.body.productId;`.
  - Если фронт поле не прислал, `productId` будет `undefined`.
- **стр. 32** — `if (!productId)` — «если id нет». `!undefined` и `!''` дают `true`, то есть условие срабатывает, когда поле не прислали или прислали пустым.
- **стр. 33** — отвечаем сразу и заканчиваем функцию:
  - `res.status(400)` — код 400 «плохой запрос» (ошибка того, кто прислал, а не сервера);
  - `.send({ message: '...' })` — текст, который фронт покажет или запишет в консоль;
  - `return` — выйти из функции. Без него код пошёл бы дальше и попытался добавить в корзину `undefined`.
- **стр. 36** — `let cart = await Cart.findOne({ user: req.user.id });` — найти корзину этого пользователя (как на стр. 14). Если её нет — `null`.
- **стр. 37–39** — корзины нет — создаём пустую (как на стр. 17–19). После этих строк `cart` точно есть.
- **стр. 42–44** — **есть ли этот товар уже в корзине?**
  - `cart.items` — массив строк корзины, например:
    `[{ product: ObjectId('65f1aaa'), quantity: 2 }, { product: ObjectId('65f1bbb'), quantity: 1 }]` — строка номер 0 и строка номер 1.
  - `findIndex(функция)` идёт по массиву с начала и для каждой строки вызывает функцию. Как только функция вернула `true` — останавливается и возвращает **номер** этой строки. Если `true` не было ни разу — возвращает `-1` («не нашёл»).
  - `(item) => ...` — функция-проверка; `item` — текущая строка корзины.
  - `item.product &&` — сначала убедиться, что поле `product` вообще есть. `&&` («и») проверяет левую часть; если она пустая, результат сразу `false`, и правая часть **не выполняется** — поэтому `.toString()` от пустоты не упадёт.
  - `item.product.toString()` — в базе id хранится как специальный объект ObjectId, а `productId` пришёл с фронта обычной строкой. Объект и строку через `===` сравнить нельзя (будет всегда `false`), поэтому превращаем id в строку `'65f1bbb'`.
  - `=== productId` — совпадает ли с id товара, который сейчас добавляют.
  - **Пример:** добавляют `'65f1bbb'`. Строка 0: `'65f1aaa' === '65f1bbb'` → `false`, дальше. Строка 1: `'65f1bbb' === '65f1bbb'` → `true`, стоп — `index = 1`. Если добавляют `'65f1ccc'` — совпадений нет, `index = -1`.
- **стр. 46** — `if (index > -1)` — «если нашли» (номер 0, 1, 2… больше чем −1).
- **стр. 47** — `cart.items[index]` — строка с этим номером; `.quantity += 1` — прибавить 1 к количеству (`+=` — «прибавить к тому, что есть»). В примере `cart.items[1].quantity` было 1, стало 2.
- **стр. 48** — `else` — иначе, то есть `index` равен `-1`, товара в корзине нет.
- **стр. 49** — `cart.items.push({...})` — добавить в конец массива новую строку: этот товар, количество 1.
- **стр. 52** — до сих пор мы меняли корзину только в памяти сервера. `cart.save()` записывает изменения в базу. `await` ждёт, пока запись закончится.
- **стр. 53** — отвечаем 200 и корзиной с подставленными товарами (`loadCart`) — фронт сразу покажет новое количество.
- **стр. 54–57** — `catch`: любая ошибка внутри `try` (например, `productId` не похож на id MongoDB, и `save` не прошёл проверку схемы) — пишем в консоль и отвечаем 500.

### Функция `removeFromCart` (стр. 61–81) — удалить товар

- **Кто вызывает:** `DELETE /api/cart/:productId` (`cartRoute.js` стр. 11). Фронт: `removeFromCart` в `CartContext.jsx` (иконка мусорки).
- **Получает:** id товара **в адресе**: `DELETE /api/cart/65f1bbb`.

```js
60 // Remove a product from the cart
61 const removeFromCart = async (req, res) => {
62   try {
63     const { productId } = req.params;
64
65     const cart = await Cart.findOne({ user: req.user.id });
66     if (!cart) {
67       return res.status(404).send({ message: 'Cart not found' });
68     }
69
70     // Keep every item except the one we were asked to remove.
71     cart.items = cart.items.filter(
72       (item) => item.product && item.product.toString() !== productId
73     );
74
75     await cart.save();
76     res.status(200).json({ data: await loadCart(cart._id) });
77   } catch (error) {
78     console.log(error.message);
79     res.status(500).send({ message: error.message });
80   }
81 };
```

- **стр. 63** — `const { productId } = req.params;` — `req.params` — части адреса, которые в роутере записаны с двоеточием. В `cartRoute.js` адрес `'/:productId'`, поэтому для `DELETE /api/cart/65f1bbb` будет `req.params = { productId: '65f1bbb' }`. Тела у DELETE-запроса обычно нет, поэтому id передают в адресе.
- **стр. 65** — найти корзину пользователя. Здесь `const`: создавать новую не будем.
- **стр. 66–68** — корзины нет — удалять нечего: код 404 «не найдено», `return` — выйти.
- **стр. 71–73** — **удалить строку с этим товаром.**
  - `filter(функция)` строит **новый** массив: проходит по каждой строке и оставляет только те, для которых функция вернула `true`.
  - Проверка та же, что в `addToCart`, но со знаком `!==` («не равно»): оставить строку, если её товар **не** тот, который удаляют.
  - `item.product &&` — строку без товара тоже выбрасываем (для неё проверка даёт `false`).
  - **Пример:** в корзине `'65f1aaa'` и `'65f1bbb'`, удаляют `'65f1bbb'`. Для `'65f1aaa'`: `'65f1aaa' !== '65f1bbb'` → `true`, остаётся. Для `'65f1bbb'`: `!==` → `false`, выбрасывается. Новый массив — только `'65f1aaa'`.
  - `cart.items = ...` — заменяем старый массив новым.
- **стр. 75** — сохранить изменения в базе.
- **стр. 76** — ответить 200 и обновлённой корзиной.
- **стр. 77–80** — ошибка — 500.

### Функция `updateQuantity` (стр. 84–111) — поменять количество

- **Кто вызывает:** `PATCH /api/cart/:productId` (`cartRoute.js` стр. 10). Фронт: `updateQuantity` в `CartContext.jsx` (кнопки + и −).
- **Получает:** id товара в адресе, новое количество в теле: `PATCH /api/cart/65f1bbb` с телом `{ "quantity": 3 }`.

```js
83  // Change how many of one product are in the cart
84  const updateQuantity = async (req, res) => {
85    try {
86      const { productId } = req.params;
87      const quantity = parseInt(req.body.quantity, 10);
88      if (!quantity || quantity < 1) {
89        return res.status(400).send({ message: 'Quantity must be 1 or more' });
90      }
91
92      const cart = await Cart.findOne({ user: req.user.id });
93      if (!cart) {
94        return res.status(404).send({ message: 'Cart not found' });
95      }
96
97      const item = cart.items.find(
98        (item) => item.product && item.product.toString() === productId
99      );
100     if (!item) {
101       return res.status(404).send({ message: 'Product is not in the cart' });
102     }
103
104     item.quantity = quantity;
105     await cart.save();
106     res.status(200).json({ data: await loadCart(cart._id) });
107   } catch (error) {
108     console.log(error.message);
109     res.status(500).send({ message: error.message });
110   }
111 };
```

- **стр. 86** — id товара из адреса (как в `removeFromCart`).
- **стр. 87** — `parseInt(req.body.quantity, 10)` — превратить то, что прислали, в целое число. Второй аргумент `10` — десятичная система. Примеры: `3` → 3, `"3"` → 3, `"2.7"` → 2, `"abc"` → `NaN` («не число»), ничего не прислали → `NaN`.
- **стр. 88** — проверка. `||` — «или», условие срабатывает, если верна хоть одна часть:
  - `!quantity` — `true` для `NaN` и для `0` (оба считаются «пустыми»);
  - `quantity < 1` — `true` для отрицательных.
- **стр. 89** — неверное количество — 400 и выйти. (Чтобы убрать товар совсем, есть отдельный адрес — `removeFromCart`.)
- **стр. 92–95** — найти корзину; нет — 404.
- **стр. 97–99** — **найти строку с этим товаром.** Проверка та же, что в `addToCart` (`item.product && item.product.toString() === productId`). Разница в том, что возвращается:
  - `findIndex` вернул бы **номер** строки (`1`) или `-1`;
  - `find` возвращает **саму строку** — объект `{ product: ..., quantity: 1 }`, или `undefined`, если не нашёл.
  - Здесь нужна сама строка, чтобы на стр. 104 сразу поменять ей количество.
- **стр. 100–102** — `find` вернул `undefined` (товара нет в корзине) — 404 и выйти.
- **стр. 104** — `item.quantity = quantity;` — меняем количество прямо в найденной строке. `item` — не копия, а ссылка на тот же объект внутри `cart.items`, поэтому изменение попадает в корзину.
- **стр. 105** — сохранить в базе.
- **стр. 106** — ответить 200 и обновлённой корзиной.
- **стр. 107–110** — ошибка — 500.

### Функция `clearCart` (стр. 114–122) — очистить корзину

- **Кто вызывает:** `DELETE /api/cart` (`cartRoute.js` стр. 12). Фронт: `clearCart` в `CartContext.jsx` — кнопка «Clear all items» и страница «Thank You» после оплаты.

```js
113 // Empty the cart, for example after the order was paid
114 const clearCart = async (req, res) => {
115   try {
116     await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
117     res.status(200).send({ message: 'Cart cleared' });
118   } catch (error) {
119     console.log(error.message);
120     res.status(500).send({ message: error.message });
121   }
122 };
123
124 module.exports = {
125   getCart,
126   addToCart,
127   removeFromCart,
128   updateQuantity,
129   clearCart
130 };
```

- **стр. 116** — `Cart.findOneAndUpdate(условие, изменения)` — найти и изменить **одним запросом**:
  - условие `{ user: req.user.id }` — корзина этого пользователя;
  - изменения `{ items: [] }` — поставить пустой массив строк.
  - Корзину не нужно сначала загружать и потом сохранять — база всё делает сама. Если корзины нет, ничего не произойдёт и ошибки не будет.
- **стр. 117** — ответить 200 и текстом `'Cart cleared'`. Корзину не возвращаем — она и так пустая.
- **стр. 118–121** — ошибка — 500.
- **стр. 124–130** — `module.exports = { ... }` — отдаём наружу объект с пятью функциями. `{ getCart, addToCart, ... }` — короткая запись `{ getCart: getCart, ... }`. `cartRoute.js` достаёт их оттуда по именам.

## 6.4 back/controllers/OrderController.js — заказы и оплата

**Что это за файл.** Оформление заказа и оплата через Stripe, письма о заказе, а для менеджера — список заказов, смена статуса и статистика.
**Кто подключает:** `ordersRoute.js` (стр. 3–10) — шесть функций; `index.js` (стр. 13) — `stripeWebhook`.

**Путь заказа целиком:**
1. Покупатель нажимает «Proceed to Payment» → `createCheckoutSession`: сервер пересчитывает цены, сохраняет заказ со статусом `pending` и создаёт страницу оплаты в Stripe.
2. Браузер переходит на страницу Stripe, покупатель вводит карту.
3. Stripe сам вызывает наш адрес `/api/orders/webhook` → `stripeWebhook`: заказ становится `paid`, остатки уменьшаются, уходят два письма.
4. Stripe возвращает покупателя на `/order-success` → `getOrderBySession` показывает номер заказа.

### Подключения и константы (стр. 1–16)

```js
1  const mongoose = require('mongoose');
2  const jwt = require('jsonwebtoken');
3  const Order = require('../models/orderModel.js');
4  const Product = require('../models/productModel.js');
5  const { sendMail } = require('../utils/email');
6
7  // Without the key on this machine there is no payment, and checkout answers 501.
8  const stripe = process.env.STRIPE_SECRET_KEY
9    ? require('stripe')(process.env.STRIPE_SECRET_KEY)
10   : null;
11
12 // A bag from the Custom Studio is not in the catalog, so its price is
13 // counted here from the chosen size and strap, never taken from the browser.
14 // The same prices are shown on the Custom Studio page.
15 const SIZE_PRICES = { mini: 120, small: 180, medium: 260, large: 360 };
16 const STRAP_PRICES = { golden: 30, silver: 30, mixed: 40, beaded: 45 };
```

- **стр. 1** — Mongoose — нужен для проверки `mongoose.Types.ObjectId.isValid` (стр. 68).
- **стр. 2** — `jsonwebtoken` — чтобы достать id покупателя из токена, если он вошёл (стр. 39).
- **стр. 3** — модель `Order` (коллекция `orders`).
- **стр. 4** — модель `Product` — цены и остатки товаров.
- **стр. 5** — `sendMail` — письма о заказе.
- **стр. 8–10** — подключение Stripe. Тернарный оператор `условие ? да : нет`:
  - если в `.env` / на Render есть `STRIPE_SECRET_KEY` — `require('stripe')` возвращает функцию, сразу вызываем её с ключом и получаем объект для работы с API Stripe;
  - если ключа нет — `null`, и оформление заказа будет отвечать 501 (стр. 135).
- **стр. 15** — цены размеров сумки из конструктора. Объект: ключ — id размера, значение — цена в долларах. `SIZE_PRICES['small']` → 180.
- **стр. 16** — цены ремешков. Те же цифры показаны покупателю в `CustomStudioPage.jsx` (стр. 27–48). Сервер считает цену сам по этим таблицам и **никогда не верит цене из браузера**.

### Функция `genOrderNumber` (стр. 19–32)

```js
18 // Order number like DH-20261021-4821: the date and four random digits.
19 const genOrderNumber = () => {
20   const today = new Date();
21
22   const year = today.getFullYear();
23   // getMonth() counts from 0 (January = 0), so 1 is added.
24   // padStart turns 7 into "07", so the number always has two digits.
25   const month = String(today.getMonth() + 1).padStart(2, '0');
26   const day = String(today.getDate()).padStart(2, '0');
27
28   // A random number from 1000 to 9999.
29   const randomPart = Math.floor(1000 + Math.random() * 9000);
30
31   return `DH-${year}${month}${day}-${randomPart}`;
32 };
```

- **Кто вызывает:** `createCheckoutSession` (стр. 160).
- **Возвращает:** строку вида `DH-20261021-4821`.
- **стр. 20** — `new Date()` — текущая дата и время.
- **стр. 22** — год: `2026`.
- **стр. 25** — месяц. `getMonth()` считает месяцы с 0 (январь — 0, октябрь — 9), поэтому `+ 1`. `String(...)` делает из числа строку, а `padStart(2, '0')` дописывает ноль слева до двух символов: `5` → `'05'`, `10` → `'10'`.
- **стр. 26** — день, тоже двумя цифрами.
- **стр. 29** — случайное число от 1000 до 9999: `Math.random()` — от 0 до 1 (не включая 1); × 9000 — от 0 до 8999.99; + 1000 — от 1000 до 9999.99; `Math.floor` — отрезать дробную часть.
- **стр. 31** — склеиваем шаблонной строкой: `DH-` + `20261021` + `-` + `4821`.

### Функция `userIdFromHeader(req)` (стр. 35–45)

```js
34 // A guest may order too, so the token is optional here. No token means null.
35 const userIdFromHeader = (req) => {
36   try {
37     const auth = req.headers.authorization;
38     if (auth?.startsWith('Bearer ')) {
39       return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET).id;
40     }
41   } catch {
42     return null;
43   }
44   return null;
45 };
```

- **Кто вызывает:** `createCheckoutSession` (стр. 161).
- **Зачем:** адрес оформления открыт и гостю, поэтому `protect` на нём не стоит. Но если покупатель вошёл, хочется записать его id в заказ. Функция проверяет токен «мягко»: нет токена или он плохой — не ошибка, а просто `null`.
- **стр. 36** — `try`: `jwt.verify` бросает ошибку на плохой токен.
- **стр. 37** — заголовок `Authorization` (например `'Bearer eyJhbGci...'`) или `undefined`.
- **стр. 38** — `auth?.startsWith('Bearer ')` — `?.` («опциональная цепочка»): если `auth` — `undefined`, выражение сразу даёт `undefined`, а не падает с ошибкой «нельзя вызвать метод у undefined».
- **стр. 39** — `auth.split(' ')[1]` — сам токен (вторая часть после пробела); `jwt.verify(токен, секрет)` — проверить и получить содержимое; `.id` — взять из него id пользователя и вернуть.
- **стр. 41–43** — `catch`: токен подделан или истёк — `null` (заказ будет гостевым, без ошибки). `catch` без `(error)` — ошибка нам не нужна.
- **стр. 44** — заголовка нет — `null`.

### Функция `buildOrderItems(rawItems)` (стр. 50–130) — главная проверка безопасности

- **Кто вызывает:** `createCheckoutSession` (стр. 148).
- **Что вызывает:** `mongoose.Types.ObjectId.isValid`, `Product.findById` (база), таблицы `SIZE_PRICES` и `STRAP_PRICES`.
- **Получает:** `rawItems` — массив позиций корзины, как его прислал браузер. Пример:
  `[{ id: '65f1bbb...', name: 'Pink Bag', price: 1, quantity: 2 }, { id: 'custom-1718...', name: 'Custom Beaded Bag', config: { size: 'small', strap: 'golden', color: 'pink' }, quantity: 1 }]`
  Цена `1` — подделка, браузер можно изменить. Функция её игнорирует.
- **Возвращает:** `{ items, error }` — позиции, собранные **с нашими ценами**, и текст первой ошибки (или `null`).

```js
47 // Builds the order lines from the cart. The price and the stock always come
48 // from our side: a catalog product from the database, a custom bag from the
49 // tables above. Whatever price the browser sent is ignored.
50 const buildOrderItems = async (rawItems) => {
51   const items = [];
52   // Only the first problem is kept and shown to the customer.
53   let error = null;
54
55   if (!rawItems) {
56     rawItems = [];
57   }
58
59   for (const it of rawItems) {
60     // The quantity is at least 1, even if the browser sent "abc", 0 or -5.
61     let quantity = parseInt(it.quantity, 10);
62     if (!quantity || quantity < 1) {
63       quantity = 1;
64     }
65
66     // Look for the product in the catalog, if the id looks like a real one.
67     let product = null;
68     if (it.id && mongoose.Types.ObjectId.isValid(it.id)) {
69       product = await Product.findById(it.id);
70     }
```

- **стр. 47–49** — комментарий: цена и остаток всегда берутся с нашей стороны.
- **стр. 51** — сюда соберём проверенные позиции.
- **стр. 53** — сюда запишем первую найденную ошибку (покажем покупателю только её). `let` — значение поменяется.
- **стр. 55–57** — если ничего не прислали (`!rawItems` — `undefined` или `null`), работаем с пустым массивом, чтобы цикл на стр. 59 не упал.
- **стр. 59** — `for (const it of rawItems)` — цикл: по очереди берём каждую позицию массива в переменную `it`.
- **стр. 61** — количество: `parseInt(значение, 10)` превращает в целое число: `2` → 2, `'2'` → 2, `'abc'` → `NaN`.
- **стр. 62–64** — не число (`!NaN` → `true`), 0 (`!0` → `true`) или меньше 1 — ставим 1.
- **стр. 67** — пока товар не найден.
- **стр. 68** — две проверки через `&&` («и»): у позиции есть `id` **и** он похож на настоящий id MongoDB (24 шестнадцатеричных символа). `mongoose.Types.ObjectId.isValid('65f1...')` → `true`, `isValid('custom-1718...')` → `false`.
- **стр. 69** — тогда ищем товар в базе. У сумки из конструктора id вида `custom-1718...` — проверка на стр. 68 не пройдёт, и `product` останется `null`.

```js
72     if (product) {
73       // stock === null means the stock is not tracked, so there is nothing to check.
74       if (typeof product.stock === 'number' && !error) {
75         if (product.stock <= 0) {
76           error = `"${product.model_name}" is out of stock`;
77         } else if (quantity > product.stock) {
78           error = `Only ${product.stock} of "${product.model_name}" left in stock`;
79         }
80       }
81       items.push({
82         product: product._id,
83         name: product.model_name,
84         category: product.category,
85         image: product.file_name,
86         price: product.price || 0,
87         quantity,
88         custom: null,
89       });
```

**Ветка «товар из каталога»** — `product` нашёлся:
- **стр. 74** — проверяем остаток, только если он отслеживается (`typeof product.stock === 'number'` — число, а не `null`) **и** ошибки ещё не было (`!error` — показываем только первую).
- **стр. 75–76** — на складе 0 или меньше — ошибка «нет в наличии». Шаблонная строка подставляет название: `"Pink Bag" is out of stock`.
- **стр. 77–78** — иначе, если просят больше, чем есть, — ошибка `Only 2 of "Pink Bag" left in stock`.
- **стр. 81–89** — добавляем позицию (`push` — в конец массива). **Все данные берутся из базы** (`product....`), а не из запроса:
  - `product: product._id` — ссылка на товар;
  - `name`, `category`, `image` — из документа товара;
  - `price: product.price || 0` — **цена из базы** (если цены нет — 0);
  - `quantity` — единственное, что взято из запроса (уже проверенное на стр. 61–64);
  - `custom: null` — это не сумка из конструктора.

```js
90      } else {
91        // Not in the catalog, so it should be a bag from the Custom Studio.
92        // Its choices (size, strap...) come in "config".
93        let config = {};
94        if (it.config) {
95          config = it.config;
96        } else if (it.custom) {
97          config = it.custom;
98        }
99
100       const sizePrice = SIZE_PRICES[config.size];
101       const strapPrice = STRAP_PRICES[config.strap];
102
103       // Not a catalog product and not a known size and strap either.
104       // typeof is checked because a made up size like "constructor" would
105       // find a built in function in the table instead of a price.
106       if (typeof sizePrice !== 'number' || typeof strapPrice !== 'number') {
107         if (!error) {
108           error = `"${it.name || 'Item'}" is no longer available`;
109         }
110         continue;
111       }
112
113       items.push({
114         product: null,
115         name: String(it.name || 'Custom item').slice(0, 120),
116         category: 'custom',
117         image: String(it.image || ''),
118         price: sizePrice + strapPrice,
119         quantity,
120         custom: {
121           size: config.size,
122           strap: config.strap,
123           chainColor: config.chainColor || null,
124           color: String(config.color || ''),
125         },
126       });
127     }
128   }
129   return { items, error };
130 };
```

**Ветка «сумка из конструктора» (или неизвестная позиция)** — `product` не нашёлся:
- **стр. 93–98** — параметры сумки: берём `it.config` (так их кладёт `CustomStudioPage`); если его нет — `it.custom`; если нет и его — остаётся пустой объект `{}` (стр. 93).
- **стр. 100** — цена размера из нашей таблицы: `SIZE_PRICES['small']` → 180. Если размер неизвестен — `undefined`.
- **стр. 101** — цена ремешка: `STRAP_PRICES['golden']` → 30.
- **стр. 106** — если хоть одна цена — не число (размер или ремешок неизвестны или подделаны)… Проверка именно `typeof`, а не `!sizePrice`: у любого объекта JavaScript есть встроенные свойства, и `SIZE_PRICES['constructor']` вернёт функцию, а не `undefined`.
- **стр. 107–109** — …ошибка «товар недоступен», если до этого ошибки ещё не было. `it.name || 'Item'` — название из запроса, а если его нет — слово `Item`.
- **стр. 110** — `continue` — пропустить эту позицию (не добавлять) и перейти к следующей.
- **стр. 113–126** — добавляем позицию:
  - **стр. 114** — `product: null` — в каталоге такого товара нет;
  - **стр. 115** — название из запроса, но принудительно строкой (`String(...)`) и не длиннее 120 символов (`slice(0, 120)`) — чтобы в базу не записали что-то огромное;
  - **стр. 116** — категория всегда `'custom'`;
  - **стр. 117** — картинка строкой;
  - **стр. 118** — **цена = размер + ремешок по нашим таблицам**: 180 + 30 = 210. Цена, которую прислал браузер, не используется вообще;
  - **стр. 119** — количество;
  - **стр. 120–125** — параметры сумки сохраняются в заказе, чтобы мастер знал, что делать. `config.chainColor || null` — цвет цепочки есть только у ремешка Mixed; `String(config.color || '')` — цвет бусин строкой.
- **стр. 129** — после цикла возвращаем объект с позициями и ошибкой.

### Функция `createCheckoutSession` — начать оплату (стр. 133–204)

- **Кто вызывает:** `ordersRoute.js` стр. 18, `POST /api/orders/checkout-session`. С фронта — `CheckoutPage.jsx`, кнопка Proceed to Payment.
- **Получает:** `{ items, customer: { name, email, phone }, shipping: { address, city, country }, deliveryMethod, notes }`.
- **Возвращает:** `{ url }` — адрес страницы оплаты Stripe.

```js
132 // Start the payment: save the order as pending and open a Stripe payment page
133 const createCheckoutSession = async (req, res) => {
134   try {
135     if (!stripe) {
136       return res.status(501).send({ message: 'Payments are not configured' });
137     }
138
139     const { items: rawItems, customer, shipping, deliveryMethod, notes } = req.body;
140
141     if (!customer?.name || !customer?.email) {
142       return res.status(400).send({ message: 'Name and email are required' });
143     }
144     if (!Array.isArray(rawItems) || rawItems.length === 0) {
145       return res.status(400).send({ message: 'Cart is empty' });
146     }
147
148     const { items, error: stockError } = await buildOrderItems(rawItems);
149     if (stockError) {
150       return res.status(400).send({ message: stockError });
151     }
152     const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
153     const total = subtotal; // free shipping for now
154
155     if (total <= 0) {
156       return res.status(400).send({ message: 'Order total is invalid' });
157     }
```

- **стр. 135–137** — Stripe не подключён (нет ключа, стр. 8–10) — 501 «Not Implemented» и выйти.
- **стр. 139** — достаём поля из тела запроса. `items: rawItems` — деструктуризация с переименованием: поле `items` кладём в переменную `rawItems` («сырые», непроверенные позиции), потому что имя `items` понадобится для проверенных (стр. 148).
- **стр. 141** — `customer?.name` — `?.` защищает от ошибки, если `customer` вообще не прислали. Нет имени **или** нет почты — 400.
- **стр. 144** — `Array.isArray(rawItems)` — это массив? Не массив **или** пустой (`length === 0`) — 400 «корзина пуста».
- **стр. 148** — проверяем позиции и ставим наши цены. Ответ `{ items, error }` раскладываем: `items` — в переменную `items`, `error` — в переменную `stockError` (переименование через двоеточие).
- **стр. 149–151** — есть ошибка (нет в наличии, неизвестная сумка) — 400 с её текстом. Фронт покажет его покупателю.
- **стр. 152** — `reduce` — сложить всё в одно число. Он проходит по массиву и держит «накопитель» `sum`:
  - начальное значение — `0` (второй аргумент `reduce`);
  - для каждой позиции `it` возвращает `sum + цена × количество`, и это становится новым `sum`.
  - Пример: позиции 180 × 2 и 210 × 1 → 0 + 360 = 360 → 360 + 210 = 570.
- **стр. 153** — итог = сумма позиций (доставка пока бесплатная).
- **стр. 155–157** — итог 0 или меньше (например, у товара нет цены) — 400. Stripe не принимает нулевые оплаты.

```js
159     const order = await Order.create({
160       orderNumber: genOrderNumber(),
161       user: userIdFromHeader(req),
162       customer: { name: customer.name, email: customer.email, phone: customer.phone || '' },
163       shipping: {
164         address: shipping?.address || '',
165         city: shipping?.city || '',
166         country: shipping?.country || '',
167       },
168       deliveryMethod: deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
169       items,
170       subtotal,
171       total,
172       currency: 'usd',
173       status: 'pending',
174       notes: notes || '',
175     });
176
177     const base = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
```

- **стр. 159** — `Order.create({...})` — сохраняем заказ в базе **до** оплаты, со статусом `pending`. Поля:
  - **стр. 160** — номер заказа (`genOrderNumber`);
  - **стр. 161** — id покупателя, если он вошёл, иначе `null`;
  - **стр. 162** — контакты. Берём только три нужных поля — лишнее из запроса в базу не попадёт. `customer.phone || ''` — нет телефона — пустая строка;
  - **стр. 163–167** — адрес; `shipping?.address || ''` — если `shipping` не прислали или поле пустое — пустая строка;
  - **стр. 168** — способ получения: если пришло `'pickup'` — `'pickup'`, **что угодно другое** — `'delivery'`. Так в базу не попадёт мусор;
  - **стр. 169–171** — проверенные позиции и суммы (`items` — короткая запись `items: items`);
  - **стр. 172–173** — валюта и статус «ждёт оплаты»;
  - **стр. 174** — комментарий или пустая строка.
- **стр. 177** — адрес нашего сайта, куда Stripe вернёт покупателя: заголовок `origin` (адрес сайта, с которого пришёл запрос), иначе `CLIENT_URL` из настроек, иначе локальный.

```js
179     const session = await stripe.checkout.sessions.create({
180       mode: 'payment',
181       payment_method_types: ['card'],
182       customer_email: customer.email,
183       line_items: items.map((it) => ({
184         price_data: {
185           currency: 'usd',
186           product_data: { name: `${it.name}${it.custom ? ' (Custom)' : ''}` },
187           unit_amount: Math.round(it.price * 100),
188         },
189         quantity: it.quantity,
190       })),
191       metadata: { orderId: order._id.toString() },
192       success_url: `${base}/order-success?session_id={CHECKOUT_SESSION_ID}`,
193       cancel_url: `${base}/checkout`,
194     });
195
196     order.payment.sessionId = session.id;
197     await order.save();
198
199     res.status(200).json({ url: session.url });
200   } catch (error) {
201     console.log(error.message);
202     res.status(500).send({ message: 'Could not start checkout' });
203   }
204 };
```

- **стр. 179** — `stripe.checkout.sessions.create({...})` — просим Stripe создать страницу оплаты. `await` ждёт ответа сервера Stripe.
  - **стр. 180** — `mode: 'payment'` — разовая оплата (не подписка);
  - **стр. 181** — способ — карта;
  - **стр. 182** — почта покупателя подставится в форму Stripe;
  - **стр. 183–190** — `line_items` — строки чека. `items.map(...)` превращает каждую нашу позицию в объект в формате Stripe (стрелочная функция с `({...})` сразу возвращает объект):
    - **стр. 185** — валюта;
    - **стр. 186** — название; для сумки из конструктора дописываем `' (Custom)'` (тернарный оператор: `it.custom` не пустой — `' (Custom)'`, иначе `''`);
    - **стр. 187** — цена за штуку **в центах**: Stripe принимает целые числа в самых мелких единицах. `210 × 100 = 21000`. `Math.round` убирает ошибки дробей (19.99 × 100 = 1998.9999… → 1999);
    - **стр. 189** — количество;
  - **стр. 191** — `metadata` — наши данные, которые Stripe вернёт в вебхуке: id заказа строкой. По нему `stripeWebhook` найдёт заказ;
  - **стр. 192** — куда вернуть после оплаты. `{CHECKOUT_SESSION_ID}` — не наша переменная (в шаблонной строке нет `$`), это метка, которую **Stripe** заменит на id сессии. Получится `/order-success?session_id=cs_test_...`;
  - **стр. 193** — куда вернуть, если покупатель нажал «назад».
- **стр. 196–197** — записываем id сессии в заказ и сохраняем — по нему страница «Спасибо» найдёт заказ (`getOrderBySession`).
- **стр. 199** — фронту отдаём только адрес страницы оплаты. Фронт делает `window.location.href = url` — браузер уходит на Stripe.
- **стр. 200–203** — любая ошибка (например, Stripe отказал) — 500 «Could not start checkout».

### Функции для писем (стр. 206–277)

```js
206 // The helpers below build the HTML of the two order emails.
207 const money = (n) => `$${Number(n).toFixed(2)}`;
```

- **Функция `money(n)`** — формат денег: `50` → `'$50.00'`. `Number(n)` — в число; `.toFixed(2)` — строка ровно с двумя знаками после точки. В шаблонной строке первый `$` — просто символ доллара, а `${...}` — вставка значения. Вызывается из `itemsTableRows`, `itemsTable`, `sendManagerReport`.

```js
209 // One table row per item. A custom bag also gets a small grey line with
210 // its choices, for example "small · golden · pink".
211 const itemsTableRows = (order) =>
212   order.items
213     .map((it) => {
214       let spec = '';
215       if (it.custom) {
216         const choices = [it.custom.size, it.custom.strap, it.custom.chainColor, it.custom.color];
217         // filter(Boolean) drops the empty ones (null, ''), so no " ·  · " appears.
218         const filled = choices.filter(Boolean);
219         spec = `<br><span style="color:#888;font-size:12px">${filled.join(' · ')}</span>`;
220       }
221       return `<tr>
222         <td style="padding:8px 0;border-bottom:1px solid #eee">${it.name}${spec}</td>
223         <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td>
224         <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(it.price * it.quantity)}</td>
225       </tr>`;
226     })
227     .join('');
```

- **Функция `itemsTableRows(order)`** — строки HTML-таблицы позиций для письма. Вызывается из `itemsTable` (стр. 248).
- **стр. 213** — `order.items.map(...)` — для каждой позиции строим кусок HTML; получится массив строк.
- **стр. 214** — `spec` — дополнительная серая строка. Для обычного товара она так и остаётся пустой.
- **стр. 215–220** — только для кастомной сумки (`it.custom` не пустой):
  - **стр. 216** — массив из четырёх параметров: размер, ремешок, цвет цепочки, цвет бусин;
  - **стр. 218** — `filter(Boolean)` убирает пустые (`null`, `''`) — например, цвет цепочки есть только у ремешка Mixed;
  - **стр. 219** — `join(' · ')` склеивает через точку: `small · beaded · black`, и оборачиваем это в серый `<span>` с переносом строки `<br>`.
- **стр. 221–225** — возвращаем строку таблицы `<tr>` с тремя ячейками `<td>`: название (+ параметры), количество, сумма по позиции (`money(цена × количество)`). `style="..."` — оформление прямо в теге: почтовые программы не понимают отдельные CSS-файлы.
- **стр. 227** — `join('')` склеивает все строки массива в одну большую строку HTML без разделителей.

```js
229 // "Self pickup", or "Delivery to Herzl 5, Tel Aviv, Israel".
230 const deliveryLine = (order) => {
231   if (order.deliveryMethod === 'pickup') {
232     return 'Self pickup';
233   }
234
235   const parts = [order.shipping.address, order.shipping.city, order.shipping.country];
236   // Empty parts are dropped, so there is no ", ," in the text.
237   const filled = parts.filter(Boolean);
238   return `Delivery to ${filled.join(', ')}`;
239 };
```

- **Функция `deliveryLine(order)`** — строка о способе получения. Вызывается из обоих писем.
- **стр. 231–233** — самовывоз — сразу возвращаем `'Self pickup'`.
- **стр. 235** — иначе собираем адрес, город и страну в массив.
- **стр. 237** — `filter(Boolean)` убирает пустые части, чтобы в тексте не было `, ,`.
- **стр. 238** — склеиваем через запятую: `'Delivery to Herzl 5, Tel Aviv, Israel'`.

```js
241 const itemsTable = (order) => `
242   <table style="width:100%;border-collapse:collapse;margin:18px 0">
243     <thead><tr>
244       <th style="text-align:left;border-bottom:2px solid #111;padding-bottom:6px">Item</th>
245       <th style="text-align:center;border-bottom:2px solid #111;padding-bottom:6px">Qty</th>
246       <th style="text-align:right;border-bottom:2px solid #111;padding-bottom:6px">Price</th>
247     </tr></thead>
248     <tbody>${itemsTableRows(order)}</tbody>
249   </table>
250   <p style="text-align:right;font-size:18px"><strong>Total: ${money(order.total)}</strong></p>`;
```

- **Функция `itemsTable(order)`** — вся таблица целиком. Стрелочная функция сразу возвращает шаблонную строку (многострочную — обратные кавычки это позволяют).
  - **стр. 242** — начало таблицы на всю ширину;
  - **стр. 243–247** — строка заголовков: Item, Qty, Price;
  - **стр. 248** — тело таблицы: строки из `itemsTableRows`;
  - **стр. 250** — итог крупным жирным шрифтом справа: `Total: $570.00`.
- Вызывается из обоих писем.

```js
252 const sendCustomerReceipt = async (order) => {
253   const html = `
254     <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
255       <h2 style="letter-spacing:2px">DARIN'S HANDMADE</h2>
256       <p>Hi ${order.customer.name}, thank you for your order!</p>
257       <p>Order <strong>${order.orderNumber}</strong> is confirmed and paid.</p>
258       ${itemsTable(order)}
259       <p style="color:#555">${deliveryLine(order)}</p>
260       <p style="color:#999;font-size:13px">Handmade to order — we'll be in touch about production & delivery.</p>
261     </div>`;
262   await sendMail({ to: order.customer.email, subject: `Your DARIN'S HANDMADE order ${order.orderNumber}`, html });
263 };
264
265 const sendManagerReport = async (order) => {
266   const to = process.env.MANAGER_EMAIL;
267   if (!to) return;
268   const html = `
269     <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
270       <h2>New order — ${order.orderNumber}</h2>
271       <p><strong>Customer:</strong> ${order.customer.name} · ${order.customer.email} · ${order.customer.phone || '—'}</p>
272       <p><strong>Fulfilment:</strong> ${deliveryLine(order)}</p>
273       ${itemsTable(order)}
274       ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
275     </div>`;
276   await sendMail({ to, subject: `New order ${order.orderNumber} — ${money(order.total)}`, html });
277 };
```

- **Функция `sendCustomerReceipt(order)`** — письмо-чек покупателю. Вызывается из `stripeWebhook` (стр. 320).
  - **стр. 253–261** — HTML письма в шаблонной строке: заголовок магазина, «Hi Anna, thank you for your order!» (`${order.customer.name}`), номер заказа, таблица позиций (`itemsTable`), способ получения (`deliveryLine`), приписка о том, что изделие делается на заказ.
  - **стр. 262** — `sendMail` на почту покупателя; тема — с номером заказа. `await` — ждём отправки. Если отправка не удалась, `sendMail` бросит ошибку — её поймает `try/catch` в `stripeWebhook`.
- **Функция `sendManagerReport(order)`** — письмо менеджеру о новом заказе. Вызывается из `stripeWebhook` (стр. 321).
  - **стр. 266** — почта менеджера из настроек (`MANAGER_EMAIL`).
  - **стр. 267** — не задана — `return`, письмо не отправляем.
  - **стр. 268–275** — HTML: номер заказа, покупатель (имя · почта · телефон, а если телефона нет — `'—'`), способ получения, таблица, комментарий. Стр. 274 — тернарный оператор: комментарий есть — абзац с ним, нет — пустая строка.
  - **стр. 276** — отправка; в теме — номер и сумма: `New order DH-20261021-4821 — $570.00`.

### Функция `stripeWebhook` — Stripe сообщает об оплате (стр. 281–332)

- **Кто вызывает:** **сервер Stripe** (не браузер!) после успешной оплаты: `POST /api/orders/webhook`. Подключена в `index.js` стр. 25, после `express.raw` — поэтому `req.body` здесь — «сырые» байты, а не объект.
- **Почему только здесь заказ становится оплаченным:** страницу «Спасибо» можно открыть вручную, а вебхук приходит от Stripe с подписью — подделать его нельзя.

```js
279 // Stripe calls this after the customer paid. Only here does the order
280 // become paid, the stock go down and the emails go out.
281 const stripeWebhook = async (req, res) => {
282   if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
283     return res.status(501).send('Stripe webhook not configured');
284   }
285
286   // The signature proves the request really came from Stripe.
287   let event;
288   try {
289     event = stripe.webhooks.constructEvent(
290       req.body,
291       req.headers['stripe-signature'],
292       process.env.STRIPE_WEBHOOK_SECRET
293     );
294   } catch (error) {
295     return res.status(400).send(`Webhook Error: ${error.message}`);
296   }
297
```

- **стр. 282–284** — Stripe не подключён или нет секрета вебхука (`STRIPE_WEBHOOK_SECRET`) — 501.
- **стр. 287** — `event` — сюда положим событие от Stripe. `let`, потому что значение присваивается внутри `try`.
- **стр. 288–293** — `stripe.webhooks.constructEvent(тело, подпись, секрет)` — проверка подлинности:
  - `req.body` — точные байты запроса (поэтому `express.raw`);
  - `req.headers['stripe-signature']` — подпись, которую Stripe положил в заголовок. Квадратные скобки — потому что в имени есть дефис;
  - `process.env.STRIPE_WEBHOOK_SECRET` — секрет вебхука из кабинета Stripe.
  - Если подпись сходится — возвращает объект события `{ type: 'checkout.session.completed', data: { object: {...} } }`. Если нет (запрос прислал не Stripe или тело изменили) — **бросает ошибку**.
- **стр. 294–296** — подпись не сошлась — 400 с текстом ошибки, заказ не трогаем.

```js
298   if (event.type === 'checkout.session.completed') {
299     const session = event.data.object;
300     try {
301       const order = await Order.findById(session.metadata?.orderId);
302       // Stripe may send the same event twice, so only a pending order is handled.
303       if (order && order.status === 'pending') {
304         order.status = 'paid';
305         order.payment.paymentIntentId = session.payment_intent;
306         order.payment.paidAt = new Date();
307         await order.save();
308
309         // The stock check is part of the query, so it never goes below zero.
310         for (const it of order.items) {
311           if (it.product) {
312             await Product.updateOne(
313               { _id: it.product, stock: { $gte: it.quantity } },
314               { $inc: { stock: -it.quantity } }
315             );
316           }
317         }
318
319         try {
320           await sendCustomerReceipt(order);
321           await sendManagerReport(order);
322         } catch (mailErr) {
323           console.error('Order email error:', mailErr);
324         }
325       }
326     } catch (error) {
327       console.log(error.message);
328     }
329   }
330
331   res.json({ received: true });
332 };
```

- **стр. 298** — Stripe присылает много разных событий; нас интересует только `checkout.session.completed` — «оплата на странице прошла».
- **стр. 299** — `session` — данные этой сессии оплаты: в них наш `metadata.orderId` и id платежа.
- **стр. 300** — внутренний `try`: ошибки базы не должны мешать ответить Stripe (стр. 331).
- **стр. 301** — находим заказ по id, который мы сами положили в `metadata` (стр. 191). `?.` — если `metadata` нет, будет `undefined`, а не ошибка.
- **стр. 303** — обрабатываем, только если заказ нашёлся **и** он ещё `pending`. Stripe может прислать одно и то же событие дважды (повтор при сбое сети) — без этой проверки остатки уменьшились бы дважды и ушло бы два письма.
- **стр. 304** — статус «оплачен».
- **стр. 305** — id платежа в Stripe (`payment_intent`).
- **стр. 306** — время оплаты — сейчас.
- **стр. 307** — сохраняем заказ.
- **стр. 310** — цикл по позициям заказа.
- **стр. 311** — только товары из каталога (у сумки из конструктора `product` — `null`, остатка нет).
- **стр. 312–315** — `Product.updateOne(условие, изменение)` — изменить один документ:
  - условие `{ _id: it.product, stock: { $gte: it.quantity } }` — товар с этим id, **у которого на складе не меньше**, чем купили (`$gte` — «greater than or equal», «больше или равно»);
  - изменение `{ $inc: { stock: -it.quantity } }` — `$inc` — прибавить к числу; прибавляем минус количество, то есть уменьшаем.
  - Проверка остатка — часть того же запроса, поэтому остаток никогда не уйдёт ниже нуля, даже если два покупателя оплатили одновременно. Если товара не хватает или остаток не отслеживается (`null`), условие не совпадёт и ничего не изменится.
- **стр. 319–321** — письмо покупателю и отчёт менеджеру.
- **стр. 322–324** — `catch (mailErr)`: письма не ушли — пишем в консоль (`console.error` — то же, что `console.log`, но помечено как ошибка), заказ при этом **уже оплачен** и сохранён.
- **стр. 326–328** — ошибка базы — в консоль.
- **стр. 331** — **всегда** отвечаем Stripe `{ received: true }` (код 200 по умолчанию). Иначе Stripe решит, что мы не получили событие, и будет присылать его снова.

### Константы статусов (стр. 334–335)

```js
334 const ALLOWED_STATUS = ['pending', 'paid', 'in_production', 'shipped', 'completed', 'cancelled'];
335 const PAID_STATUSES = ['paid', 'in_production', 'shipped', 'completed'];
```

- **стр. 334** — все разрешённые статусы. Используется в `updateOrderStatus` (стр. 421): менеджер не может поставить статус, которого нет в списке.
- **стр. 335** — статусы, в которых заказ уже **оплачен**. Используется в статистике (стр. 341): неоплаченные (`pending`) и отменённые в выручку не попадают.

### Функция `getStats` — статистика продаж (стр. 338–385)

- **Кто вызывает:** `GET /api/orders/stats` (`ordersRoute.js` стр. 22). Фронт: `ManagerOrdersPage` (`loadStats`), с параметром `?days=7`, `?days=30` или без него («за всё время»).
- **Возвращает:** `{ data: { revenue, orders, avgOrder, byStatus, topProducts } }`.

```js
337 // Sales numbers for the manager: revenue, number of orders, top products
338 const getStats = async (req, res) => {
339   try {
340     const days = Number(req.query.days);
341     const match = { status: { $in: PAID_STATUSES } };
342     if (days > 0) {
343       match.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
344     }
345
346     const [totals] = await Order.aggregate([
347       { $match: match },
348       { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
349     ]);
350
351     const byStatus = await Order.aggregate([
352       { $group: { _id: '$status', count: { $sum: 1 } } },
353     ]);
354
355     const topProducts = await Order.aggregate([
356       { $match: match },
357       { $unwind: '$items' },
358       {
359         $group: {
360           _id: '$items.name',
361           qty: { $sum: '$items.quantity' },
362           revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
363         },
364       },
365       { $sort: { qty: -1 } },
366       { $limit: 5 },
367     ]);
```

- **стр. 340** — `req.query` — параметры после `?` в адресе: для `/stats?days=30` будет `req.query.days = '30'` (строкой). `Number(...)` → 30. Без параметра — `Number(undefined)` → `NaN`.
- **стр. 341** — условие отбора: статус входит в список оплаченных. `$in` — оператор MongoDB «значение — одно из списка».
- **стр. 342–344** — если задано число дней (больше 0; `NaN > 0` — `false`), добавляем условие по дате: `createdAt` не раньше (`$gte`), чем «сейчас минус N дней». `days * 24 * 60 * 60 * 1000` — N дней в миллисекундах; `new Date(число)` — дата из миллисекунд.
- **стр. 346–349** — `Order.aggregate([...])` — «конвейер» обработки в базе: каждый шаг получает документы от предыдущего.
  - **стр. 347** — `$match` — оставить только заказы, подходящие под условие (стр. 341–344);
  - **стр. 348** — `$group` — собрать их в группы. `_id: null` — одна общая группа на все заказы. В ней считаем: `revenue` — сумма полей `total` (`$sum: '$total'`, `$` перед именем — «значение поля»), `count` — количество (`$sum: 1` — прибавить 1 за каждый документ).
  - Результат — массив из одного объекта: `[{ _id: null, revenue: 1250, count: 4 }]`, или пустой массив, если заказов нет.
  - `const [totals] = ...` — деструктуризация массива: первый элемент кладём в `totals`. Пустой массив — `totals` будет `undefined`.
- **стр. 351–353** — сколько заказов в каждом статусе (по **всем** заказам, без отбора): `$group` с `_id: '$status'` — группа на каждое значение статуса. Результат: `[{ _id: 'paid', count: 3 }, { _id: 'pending', count: 2 }]`.
- **стр. 355–367** — пять самых продаваемых товаров:
  - **стр. 356** — только оплаченные (и за период);
  - **стр. 357** — `$unwind: '$items'` — «развернуть» массив: заказ с тремя позициями превращается в три документа, в каждом одна позиция. Так можно считать по позициям;
  - **стр. 359–363** — группа на каждое название товара: `qty` — сколько штук продано (сумма количеств), `revenue` — выручка (сумма цена × количество, `$multiply` — умножить);
  - **стр. 365** — `$sort: { qty: -1 }` — по количеству, от большего к меньшему (`-1` — по убыванию);
  - **стр. 366** — `$limit: 5` — первые пять.

```js
369     const revenue = totals?.revenue || 0;
370     const orders = totals?.count || 0;
371
372     res.status(200).json({
373       data: {
374         revenue,
375         orders,
376         avgOrder: orders ? revenue / orders : 0,
377         byStatus,
378         topProducts,
379       }
380     });
381   } catch (error) {
382     console.log(error.message);
383     res.status(500).send({ message: error.message });
384   }
385 };
```

- **стр. 369** — выручка: `totals?.revenue` — если `totals` нет (заказов нет), `?.` даст `undefined`, и `|| 0` поставит 0.
- **стр. 370** — количество заказов, так же.
- **стр. 372–380** — 200 и объект статистики:
  - **стр. 376** — `avgOrder` — средний чек: выручка / количество. Тернарный оператор защищает от деления на ноль: заказов нет — 0.
- **стр. 381–384** — ошибка — 500.

### Функция `getAllOrders` — список заказов (стр. 388–403)

```js
387 // All orders for the manager, with a status filter and a search box
388 const getAllOrders = async (req, res) => {
389   try {
390     const { status, search } = req.query;
391     const query = {};
392     if (status && status !== 'all') query.status = status;
393     if (search) {
394       const rx = new RegExp(String(search).trim(), 'i');
395       query.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.email': rx }];
396     }
397     const orders = await Order.find(query).sort({ createdAt: -1 }).limit(200);
398     res.status(200).json({ data: orders });
399   } catch (error) {
400     console.log(error.message);
401     res.status(500).send({ message: error.message });
402   }
403 };
```

- **Кто вызывает:** `GET /api/orders` (`ordersRoute.js` стр. 21). Фронт: `ManagerOrdersPage` (`load`), с параметрами `?status=paid&search=anna`.
- **стр. 390** — статус и строка поиска из адреса (`req.query`).
- **стр. 391** — условие поиска, пока пустое (`{}` — все заказы).
- **стр. 392** — выбран статус и это не `'all'` — добавляем `query.status = 'paid'`.
- **стр. 393–396** — есть строка поиска:
  - **стр. 394** — `new RegExp(текст, 'i')` — регулярное выражение из текста; `'i'` — без учёта регистра. `/anna/i` найдёт `Anna`, `ANNA`, `Joanna`. `String(...).trim()` — строкой и без пробелов по краям;
  - **стр. 395** — `$or` — «подходит хотя бы одно»: номер заказа, имя покупателя **или** его почта содержат этот текст. `'customer.name'` в кавычках — путь к вложенному полю.
- **стр. 397** — `Order.find(query)` — найти по условию; `.sort({ createdAt: -1 })` — новые сверху; `.limit(200)` — не больше 200, чтобы страница не тормозила.
- **стр. 398** — 200 и массив заказов.
- **стр. 399–402** — ошибка — 500.

### Функция `getOrderById` (стр. 406–415)

```js
405 // Get one order
406 const getOrderById = async (req, res) => {
407   try {
408     const order = await Order.findById(req.params.id);
409     if (!order) return res.status(404).send({ message: 'Order not found' });
410     res.status(200).json({ data: order });
411   } catch (error) {
412     console.log(error.message);
413     res.status(500).send({ message: error.message });
414   }
415 };
```

- **Кто вызывает:** `GET /api/orders/:id` (`ordersRoute.js` стр. 24). Со страниц сейчас не вызывается.
- **стр. 408** — найти заказ по id из адреса.
- **стр. 409** — не найден — 404 (в одну строку: `if (...) return ...;`).
- **стр. 410** — 200 и заказ.

### Функция `updateOrderStatus` (стр. 418–431)

```js
417 // Move an order to another status, for example paid -> shipped
418 const updateOrderStatus = async (req, res) => {
419   try {
420     const { status } = req.body;
421     if (!ALLOWED_STATUS.includes(status)) {
422       return res.status(400).send({ message: 'Invalid status' });
423     }
424     const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
425     if (!order) return res.status(404).send({ message: 'Order not found' });
426     res.status(200).json({ data: order });
427   } catch (error) {
428     console.log(error.message);
429     res.status(500).send({ message: error.message });
430   }
431 };
```

- **Кто вызывает:** `PATCH /api/orders/:id/status` (`ordersRoute.js` стр. 23). Фронт: `ManagerOrdersPage` (`changeStatus`) — выпадающий список статуса.
- **стр. 420** — новый статус из тела запроса.
- **стр. 421–423** — `ALLOWED_STATUS.includes(status)` — есть ли такой статус в списке (стр. 334). Нет — 400 «Invalid status».
- **стр. 424** — `findByIdAndUpdate(id, { status }, { new: true })` — найти заказ и поставить статус; `new: true` — вернуть уже обновлённый.
- **стр. 425** — нет такого заказа — 404.
- **стр. 426** — 200 и обновлённый заказ (фронт заменит его в списке).

### Функция `getOrderBySession` (стр. 434–450)

```js
433 // For the Thank You page: a short summary of the order, found by the Stripe session
434 const getOrderBySession = async (req, res) => {
435   try {
436     const order = await Order.findOne({ 'payment.sessionId': req.params.sessionId });
437     if (!order) return res.status(404).send({ message: 'Order not found' });
438     res.status(200).json({
439       data: {
440         orderNumber: order.orderNumber,
441         status: order.status,
442         total: order.total,
443         email: order.customer.email,
444       }
445     });
446   } catch (error) {
447     console.log(error.message);
448     res.status(500).send({ message: error.message });
449   }
450 };
451
452 module.exports = {
453   createCheckoutSession,
454   stripeWebhook,
455   getOrderBySession,
456   getAllOrders,
457   getOrderById,
458   updateOrderStatus,
459   getStats,
460 };
```

- **Кто вызывает:** `GET /api/orders/by-session/:sessionId` (`ordersRoute.js` стр. 19). Фронт: `OrderSuccessPage` — Stripe вернул покупателя с `?session_id=...` в адресе.
- **стр. 436** — ищем заказ, у которого `payment.sessionId` равен id из адреса (его записали на стр. 196). `'payment.sessionId'` в кавычках — путь к вложенному полю.
- **стр. 437** — не найден — 404.
- **стр. 438–445** — отдаём **не весь заказ**, а только номер, статус, сумму и почту: адрес открыт без входа, лишнего (адрес, телефон) показывать не нужно.
- **стр. 446–449** — ошибка — 500.
- **стр. 452–460** — отдаём наружу семь функций.

# Часть 7. Сервер: заполнение каталога и роль менеджера

Скрипт из папки `seed` сайт **не вызывает**. Его запускают вручную из терминала в папке `back`.

## 7.1 back/seed/products.js — заполнить каталог

**Что это за файл.** Скрипт, который стирает все товары в базе и записывает заново из файла `productsData.json`. Сайт его не вызывает.
**Запуск:** в терминале, в папке `back`: `node seed/products.js`.

```js
1  const dotenv = require('dotenv');
2  const connectDB = require('../db/connect');
3  const Product = require('../models/productModel.js');
4  const products = require('./productsData.json');
5
6  dotenv.config();
7
8  const start = async () => {
9    try {
10     await connectDB(process.env.MONGO_URI);
11     await Product.deleteMany();
12     await Product.insertMany(products);
13     console.log('Seed done');
14     process.exit(0);
15   } catch (error) {
16     console.log(error.message);
17     process.exit(1);
18   }
19 };
20
21 start();
```

- **стр. 1** — библиотека `dotenv` (чтобы прочитать `MONGO_URI` из `.env`). Здесь она подключена в два шага: сначала берём саму библиотеку, а `config()` вызываем на стр. 6.
- **стр. 2** — функция подключения к базе (`db/connect.js`).
- **стр. 3** — модель товара.
- **стр. 4** — `require` умеет сразу читать JSON-файл: получаем обычный массив объектов-товаров из `productsData.json`.
- **стр. 6** — читаем `.env` — теперь есть `process.env.MONGO_URI`.
- **стр. 8** — функция `start`, `async` — внутри `await`.
- **стр. 10** — подключаемся к базе и ждём.
- **стр. 11** — `Product.deleteMany()` без условия — **удалить все товары** из коллекции `products`. Осторожно: менеджерские правки тоже пропадут.
- **стр. 12** — `Product.insertMany(массив)` — вставить все товары из файла одним запросом. Mongoose проверит каждый по схеме.
- **стр. 13** — сообщение в терминал.
- **стр. 14** — `process.exit(0)` — завершить программу; `0` — «успешно». Без этого Node не закрылся бы сам: открытое соединение с базой держит программу живой.
- **стр. 15–18** — ошибка (нет доступа к базе, товар не прошёл проверку схемы) — печатаем текст и выходим с кодом `1` — «ошибка».
- **стр. 21** — запускаем `start()`.

**back/seed/productsData.json** — массив объектов-товаров: `file_name`, `model_name`, `color_palette`, `details`, `style`, `category`, `price`. Поля `stock` там нет, поэтому после заполнения остаток не отслеживается (`null` по умолчанию).

## 7.2 Как назначается менеджер

Отдельного скрипта для этого в проекте нет. Роль меняется **вручную в базе данных**:

1. Человек регистрируется на сайте обычным способом — в базе появляется документ в коллекции `users` с `role: 'user'` (значение по умолчанию из `userModel.js`, стр. 25–28).
2. Владелец сайта открывает MongoDB Atlas → **Browse Collections** → коллекция `users`.
3. Находит пользователя по полю `email` и меняет `role` на `manager` (или `admin`), сохраняет.
4. Пользователь выходит и снова входит (или просто обновляет страницу): `App.jsx` спрашивает `/api/auth/me`, `protect` читает роль **из базы** — и у человека появляется ссылка MANAGE и доступ к `/admin`.

Почему так: на сервере нет ни одного адреса, через который можно стать менеджером. `signup` (AuthController, стр. 55) не принимает поле `role`, поэтому через регистрацию роль тоже не поменять. Изменить роль может только тот, у кого есть доступ к самой базе.


---

# Часть 8. Сайт: запуск, настройки, связь с сервером

**Что нужно знать про React, чтобы читать дальше:**

- **Компонент** — функция, которая возвращает разметку (JSX). Пример: `const HomePage = () => { return (<div>...</div>); };`. Используется как тег: `<HomePage />`.
- **JSX** — HTML-подобная запись внутри JavaScript. В фигурных скобках `{...}` — любое JS-выражение: `<h1>{product.model_name}</h1>`. Вместо `class` пишется `className`. Браузер JSX не понимает — его переводит в обычный JS сборщик Vite.
- **Пропсы (props)** — данные, которые родитель передаёт компоненту как атрибуты: `<ManagerProductsPage token={token} />` → внутри `({ token }) => ...`.
- **`useState(начальное)`** — хранит значение в компоненте. Возвращает пару `[значение, функция_изменения]`. Когда вызывают функцию изменения, React **перерисовывает** компонент с новым значением.
- **`useEffect(функция, [зависимости])`** — выполнить код **после** отрисовки. `[]` — один раз при открытии страницы. `[id]` — каждый раз, когда меняется `id`. Если функция внутри возвращает другую функцию, та вызывается при уходе со страницы (очистка).
- **Условная отрисовка:** `{условие && <div/>}` — показать, только если условие истинно. `{условие ? <A/> : <B/>}` — одно или другое.
- **Списки:** `{массив.map((x) => <div key={x.id}>...</div>)}` — нарисовать элемент для каждого. `key` — уникальный ключ, по нему React понимает, какой элемент изменился.
- **`className="..."`** со словами вроде `bg-black text-white py-4 md:px-8 text-[18px]` — это **Tailwind**: каждое слово — один стиль. `bg-black` — чёрный фон, `py-4` — отступ сверху и снизу, `md:` — только на экранах от среднего размера, `[18px]` — точное значение. Классы стилей ниже подробно не расписываются — они отвечают только за внешний вид.

## 8.1 front/index.html — единственная HTML-страница

```html
1  <!doctype html>
2  <html lang="en">
3    <head>
4      <meta charset="UTF-8" />
5      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
6      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
7      <title>Darin's Handmade</title>
8    </head>
9    <body>
10     <div id="root"></div>
11     <script type="module" src="/src/main.jsx"></script>
12   </body>
13 </html>
```

- **стр. 1–2** — HTML-документ, язык английский.
- **стр. 4** — кодировка UTF-8.
- **стр. 5** — иконка вкладки.
- **стр. 6** — подстройка под ширину экрана телефона.
- **стр. 7** — заголовок вкладки.
- **стр. 10** — пустой `div` с `id="root"` — сюда React нарисует весь сайт.
- **стр. 11** — подключение `src/main.jsx` — с него начинается приложение. `type="module"` — современный JavaScript с `import`.

Сайт — **одностраничное приложение (SPA)**: браузер загружает один `index.html`, а все «страницы» рисует React, меняя содержимое `#root` без перезагрузки.

## 8.2 front/package.json — библиотеки сайта

- **стр. 6–11 `"scripts"`**: `npm run dev` — `vite` (сайт в режиме разработки на `localhost:5173`); `npm run build` — `vite build` (собрать готовые файлы в папку `dist` для публикации; так делает Render); `npm run lint` — проверка кода ESLint; `npm run preview` — посмотреть собранную версию.
- **стр. 12–22 `"dependencies"`**: `react`, `react-dom` — сама библиотека и вывод в браузер; `react-router-dom` — страницы и переходы; `axios` — запросы к серверу; `tailwindcss` и `@tailwindcss/vite` — стили; `framer-motion` — анимации; `lucide-react` — иконки; `react-image-magnifier-lens` — установлена, но в коде не используется.
- **стр. 23–33 `"devDependencies"`**: инструменты разработки — `vite`, `@vitejs/plugin-react`, `eslint` и его плагины, типы для редактора.

## 8.3 front/vite.config.js — настройка сборщика

```js
1 import { defineConfig } from 'vite'
2 import react from '@vitejs/plugin-react'
3 import tailwindcss from '@tailwindcss/vite'
4
5 export default defineConfig({
6   plugins: [react(), tailwindcss()],
7 })
```

- **стр. 1** — `defineConfig` — помощник Vite для файла настроек (подсказки в редакторе).
- **стр. 2** — плагин React: учит Vite понимать JSX.
- **стр. 3** — плагин Tailwind: превращает классы вроде `bg-black` в CSS.
- **стр. 6** — подключаем оба плагина.

## 8.4 front/eslint.config.js — правила проверки кода

- **стр. 1–5** — подключение наборов правил: базовые правила JS, браузерные глобальные переменные, правила хуков React, правила быстрой перезагрузки Vite.
- **стр. 8** — не проверять папку `dist` (собранные файлы).
- **стр. 10** — проверять все `.js` и `.jsx`.
- **стр. 11–15** — какие наборы правил включить.
- **стр. 17** — разрешить браузерные переменные (`window`, `localStorage`).
- **стр. 18** — разрешить JSX.

На работу сайта не влияет — только подсказывает ошибки в редакторе и в `npm run lint`.

## 8.5 front/public/_redirects

```
1 /*    /index.html   200
```

Правило для хостинга: на **любой** адрес (`/*`) отдавать `index.html` с кодом 200. Нужно, потому что адреса вроде `/products/123` существуют только внутри React: без этого правила при обновлении страницы хостинг искал бы файл `products/123` и отвечал 404.

## 8.6 front/src/index.css — общие стили

```css
1  @import url("https://fonts.googleapis.com/css2?family=Dorsa&display=swap");
2  @import "tailwindcss";
3
4  * {
5    box-sizing: border-box;
6  }
7
8  html,
9  body,
10 #root {
11   margin: 0;
12   padding: 0;
13   min-height: 100%;
14 }
15
16 body {
17   background: #f3f3f1;
18 }
```

- **стр. 1** — шрифт Dorsa (высокие узкие буквы заголовков) с Google Fonts.
- **стр. 2** — подключение Tailwind.
- **стр. 4–6** — для всех элементов: ширина включает рамку и отступы (так проще считать размеры).
- **стр. 8–14** — убрать стандартные отступы браузера, растянуть на всю высоту.
- **стр. 16–18** — светло-серый фон страницы.

**front/src/shared/ui/Header.css** — файл со стилями `.header`, `.header__nav`, `.header__link`. **Нигде не подключается** — остался от старой версии шапки, сейчас шапка оформлена классами Tailwind.

## 8.7 front/src/main.jsx — точка входа React

**Кто подключает:** `index.html` (стр. 11).

```jsx
1  import React from 'react';
2  import { createRoot } from 'react-dom/client';
3  import { BrowserRouter } from 'react-router-dom';
4  import App from './App';
5  import './index.css';
6
7  // BrowserRouter has to wrap the whole app, so that every page and the
8  // header can use Link and useNavigate.
9  createRoot(document.getElementById('root')).render(
10   <BrowserRouter>
11     <App />
12   </BrowserRouter>
13 );
```

- **стр. 1** — React (нужен для JSX).
- **стр. 2** — `createRoot` из `react-dom/client` — подключить React к HTML-элементу.
- **стр. 3** — `BrowserRouter` из `react-router-dom` — включает работу с адресами страниц.
- **стр. 4** — главный компонент `App` из `App.jsx`.
- **стр. 5** — подключение стилей (Vite вставит их на страницу).
- **стр. 9** — `document.getElementById('root')` находит `<div id="root">` из `index.html`; `createRoot(...)` делает его корнем React; `.render(...)` — нарисовать туда.
- **стр. 10–12** — `App` обёрнут в `BrowserRouter`. Без этой обёртки `Link`, `NavLink`, `useNavigate`, `useParams` не работали бы ни в одном компоненте.

## 8.8 front/src/api.jsx — связь с сервером

**Что это за файл.** Единственное место, где записан адрес сервера, плюс две вспомогательные функции.
**Кто подключает:** `App.jsx`, `CartContext.jsx`, и страницы `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `BeadedBagsPage`, `BraceletsPage`, `ProductDetailPage`, `CheckoutPage`, `OrderSuccessPage`, `ManagerProductsPage`, `ManagerOrdersPage`.
**Что подключает:** `axios` (стр. 1).

```js
1  import axios from 'axios';
2
3  // One place that knows the address of the server. On the development machine
4  // it is the local server; anywhere else it is the deployed one.
5  const hostname = window.location.hostname;
6  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
7
8  let baseUrl = 'https://darinshandmade.onrender.com';
9  if (isLocalhost) {
10   baseUrl = 'http://localhost:5000';
11 } else if (import.meta.env.VITE_API_URL) {
12   baseUrl = import.meta.env.VITE_API_URL;
13 }
14
15 export const API_BASE_URL = baseUrl;
16
17 // Same value under the shorter name used by the order and account pages.
18 export const API = API_BASE_URL;
```

- **стр. 1** — библиотека axios — отправка HTTP-запросов.
- **стр. 5** — `window.location.hostname` — имя сайта в адресной строке: `localhost` на своём компьютере, `darinshandmade.netlify.app` в интернете.
- **стр. 6** — `isLocalhost` — открыт ли сайт на своём компьютере: имя равно `localhost` или `127.0.0.1`.
- **стр. 8** — по умолчанию — адрес сервера на Render. `let`, потому что ниже он может поменяться.
- **стр. 9–10** — на своём компьютере — локальный сервер `http://localhost:5000`.
- **стр. 11–12** — иначе, если задана переменная `VITE_API_URL` (Vite подставляет её при сборке через `import.meta.env`), — берём её.
- **стр. 15** — экспортируем итоговый адрес под именем `API_BASE_URL`.
- **стр. 18** — тот же адрес под коротким именем `API`. Сейчас в коде не используется.

```js
20 const api = axios.create({
21   baseURL: API_BASE_URL,
22 });
```

- **стр. 20–22** — `axios.create` — настроенная копия axios. Теперь `api.get('/api/products')` сам добавит адрес сервера в начало. Методы: `api.get(адрес, настройки)`, `api.post(адрес, тело, настройки)`, `api.put`, `api.patch`, `api.delete(адрес, настройки)`. Каждый возвращает Promise: `.then(response => ...)` — успех (код 2xx), `.catch(error => ...)` — ошибка (сеть или код 4xx/5xx). Ответ сервера лежит в `response.data`; сообщение ошибки — в `error.response.data.message`.

```js
24 // Builds the full address of a picture that the server keeps in /uploads,
25 // for example: imageUrl('uploads/pink.jpg') -> http://localhost:5000/uploads/pink.jpg
26 export const imageUrl = (fileName) => {
27   if (!fileName) {
28     return '';
29   }
30
31   // "/uploads/pink.jpg" -> "uploads/pink.jpg", so the address has no "//".
32   let cleanName = String(fileName);
33   if (cleanName.startsWith('/')) {
34     cleanName = cleanName.slice(1);
35   }
36
37   return `${API_BASE_URL}/${cleanName}`;
38 };
```

**Функция `imageUrl(fileName)`** — полный адрес картинки товара.
- **Кто вызывает:** `CartContext` (стр. 46, 123), `BeadedBagsPage`, `BraceletsPage`, `ProductDetailPage`, `ManagerProductsPage`.
- **стр. 27–29** — имени нет — пустая строка.
- **стр. 32** — имя файла строкой (`let`, потому что дальше может поменяться).
- **стр. 33–35** — если путь начинается со `/`, отрезаем первый символ (`slice(1)`), чтобы в адресе не получилось `//`.
- **стр. 37** — адрес сервера + `/` + путь. Картинку по этому адресу отдаёт `express.static` на сервере.

```js
40 // The token is kept in localStorage after login and has to be sent with
41 // every protected request, in the header the server expects.
42 export const authHeader = (token) => {
43   return { headers: { Authorization: `Bearer ${token}` } };
44 };
45
46 export default api;
```

**Функция `authHeader(token)`** — настройки запроса с заголовком входа.
- **Кто вызывает:** `App.jsx`, `CartContext.jsx`, `CheckoutPage`, `ManagerProductsPage`, `ManagerOrdersPage`.
- **стр. 43** — возвращает `{ headers: { Authorization: 'Bearer <токен>' } }`. Передаётся последним аргументом в `api.get/post/...`. На сервере этот заголовок читает `protect` (стр. 5).
- **стр. 46** — `export default api` — главный экспорт файла. Импортируется как `import api, { imageUrl, authHeader } from '../api'` — `api` без скобок, остальное в фигурных скобках.

## 8.9 front/src/App.jsx — главный компонент, вход и маршруты

**Что это за файл.** Корень сайта. Хранит, кто вошёл (токен и пользователь), даёт корзину всем страницам, рисует шапку, подвал и нужную страницу по адресу. Здесь же закрыт доступ к страницам менеджера.
**Кто подключает:** `main.jsx` (стр. 4).

### Подключения (стр. 1–23)

```jsx
1  import React, { useState, useEffect } from "react";
2  import { Routes, Route, Navigate } from "react-router-dom";
3  import api, { authHeader } from "./api";
4  import { CartProvider } from "./context/CartContext";
5
6  import Header from "./shared/ui/Header";
7  import Footer from "./shared/ui/Footer";
8  import HomePage from "./pages/home/HomePage";
9  import AboutPage from "./pages/about/AboutPage";
10 import BeadedBagsPage from "./pages/beaded-bags/BeadedBagsPage";
11 import BraceletsPage from "./pages/bracelets/BraceletsPage";
12 import CustomStudioPage from "./pages/custom-studio/CustomStudioPage";
13 import LoginPage from "./pages/login/LoginPage";
14 import ForgotPasswordPage from "./pages/login/ForgotPasswordPage";
15 import ResetPasswordPage from "./pages/login/ResetPasswordPage";
16 import CartPage from "./pages/cart/CartPage";
17 import ProductDetailPage from "./pages/product/ProductDetailPage";
18 import CheckoutPage from "./pages/checkout/CheckoutPage";
19 import OrderSuccessPage from "./pages/order/OrderSuccessPage";
20 import ManagerProductsPage from "./pages/admin/ManagerProductsPage";
21 import ManagerOrdersPage from "./pages/admin/ManagerOrdersPage";
22 import PrivacyPolicyPage from "./pages/legal/PrivacyPolicyPage";
23 import TermsOfServicePage from "./pages/legal/TermsOfServicePage";
```

- **стр. 1** — React и два хука: `useState` (хранить значение) и `useEffect` (выполнить код после отрисовки).
- **стр. 2** — из `react-router-dom`: `Routes` (контейнер маршрутов), `Route` (один маршрут «адрес → страница»), `Navigate` (перенаправить на другой адрес).
- **стр. 3** — `api` (настроенный axios) и `authHeader` из `api.jsx`.
- **стр. 4** — `CartProvider` из `CartContext.jsx` — «раздатчик» корзины.
- **стр. 6–7** — шапка и подвал — есть на каждой странице.
- **стр. 8–23** — все страницы сайта. Каждая — компонент в своей папке `pages/...`.

### Функция `readUser()` (стр. 27–33)

```jsx
25 // Reads the saved user out of localStorage. It is wrapped in try/catch
26 // because localStorage holds text, and broken text would crash JSON.parse.
27 const readUser = () => {
28   try {
29     return JSON.parse(localStorage.getItem("user")) || null;
30   } catch {
31     return null;
32   }
33 };
```

- **Зачем:** после входа `LoginPage` сохраняет пользователя в `localStorage` (хранилище браузера, живёт после закрытия вкладки). Там можно хранить только текст, поэтому объект сохранён строкой JSON: `'{"id":"65aa...","name":"Anna","role":"user"}'`.
- **стр. 29** — `localStorage.getItem("user")` — достать строку (или `null`, если её нет). `JSON.parse(строка)` — превратить обратно в объект. `JSON.parse(null)` даёт `null`, и `|| null` вернёт `null`.
- **стр. 30–32** — если строка испорчена (не настоящий JSON), `JSON.parse` бросит ошибку — ловим её и возвращаем `null` вместо падения всего сайта.

### Компонент `App` (стр. 35–103)

```jsx
35 const App = () => {
36   const [token, setToken] = useState(localStorage.getItem("token"));
37   const [user, setUser] = useState(readUser);
38
39   useEffect(() => {
40     const sync = () => {
41       setToken(localStorage.getItem("token"));
42       setUser(readUser());
43     };
44     window.addEventListener("storage", sync);
45     return () => window.removeEventListener("storage", sync);
46   }, []);
```

- **стр. 35** — компонент `App` — функция, которая возвращает разметку.
- **стр. 36** — состояние `token`: начальное значение — токен из `localStorage` (или `null`, если не входили). `useState` возвращает пару: само значение и функцию `setToken`, которой его меняют. Когда вызывают `setToken`, React перерисовывает `App` и всё, что внутри.
- **стр. 37** — состояние `user`. `useState(readUser)` — передаём **саму функцию**, без скобок: React вызовет её один раз при первой отрисовке, а не при каждой.
- **стр. 39–46** — первый эффект: синхронизация между вкладками. `[]` в конце (стр. 46) — выполнить один раз, после первой отрисовки.
  - **стр. 40–43** — функция `sync`: заново прочитать токен и пользователя из `localStorage` и положить в состояние.
  - **стр. 44** — `window.addEventListener("storage", sync)` — подписаться на событие `storage`. Браузер присылает его, когда `localStorage` изменили **в другой вкладке** этого же сайта. Например, вышли в другой вкладке — эта тоже узнает и покажет «не вошёл».
  - **стр. 45** — эффект возвращает функцию очистки: React вызовет её, когда `App` исчезнет, — отписаться от события.

```jsx
48   useEffect(() => {
49     if (!token) {
50       setUser(null);
51       return;
52     }
53     // Ask the server who this user is, so the role used by the /admin guard
54     // comes from the server and not from an old copy in localStorage.
55     api
56       .get("/api/auth/me", authHeader(token))
57       .then((response) => {
58         setUser(response.data.user);
59         localStorage.setItem("user", JSON.stringify(response.data.user));
60       })
61       .catch((error) => {
62         console.log(error);
63       });
64   }, [token]);
65
66   const isManager = user?.role === "manager" || user?.role === "admin";
```

- **стр. 48–64** — второй эффект: «кто вошёл». `[token]` в конце (стр. 64) — выполняется после первой отрисовки и **каждый раз, когда меняется токен** (вход, выход).
- **стр. 49–52** — токена нет (не вошли или вышли) — пользователя нет: `setUser(null)` и выйти из эффекта.
- **стр. 55–56** — `api.get(адрес, настройки)` — запрос `GET /api/auth/me` с токеном в заголовке (`authHeader(token)`). На сервере его проверит `protect`, а `getMe` вернёт пользователя из базы.
- **стр. 57** — `.then((response) => {...})` — выполнится, когда сервер ответил успешно. `response.data` — тело ответа, то есть `{ user: {...} }`.
- **стр. 58** — кладём пользователя в состояние — шапка покажет его имя.
- **стр. 59** — сохраняем свежую копию в `localStorage` строкой (`JSON.stringify` — объект в строку).
- **стр. 61–63** — `.catch(...)` — запрос не удался (токен истёк — сервер ответил 401, или сервер недоступен). Пишем ошибку в консоль браузера.
- Зачем вообще спрашивать сервер: роль в `localStorage` можно подменить руками в браузере. А роль от сервера — настоящая, из базы.
- **стр. 66** — `isManager` — `true`, если роль `manager` или `admin`. `user?.role` — `?.`: если `user` — `null`, получится `undefined`, а не ошибка.

```jsx
68    return (
69      <CartProvider token={token}>
70        <Header token={token} setToken={setToken} setUser={setUser} user={user} />
71
72        <div>
73          <Routes>
74            <Route path="/" element={<HomePage />} />
75            <Route path="/about" element={<AboutPage />} />
76            <Route path="/beaded-bags" element={<BeadedBagsPage />} />
77            <Route path="/bracelets" element={<BraceletsPage />} />
78
79            <Route path="/custom-studio" element={<CustomStudioPage />} />
80            <Route path="/login" element={<LoginPage setToken={setToken} setUser={setUser} />} />
81            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
82            <Route path="/reset-password" element={<ResetPasswordPage />} />
83            <Route path="/cart" element={<CartPage />} />
84            <Route path="/checkout" element={<CheckoutPage />} />
85            <Route path="/order-success" element={<OrderSuccessPage />} />
86            <Route path="/products/:id" element={<ProductDetailPage />} />
87            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
88            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
89            <Route
90              path="/admin"
91              element={isManager ? <ManagerProductsPage token={token} /> : <Navigate to="/login" replace />}
92            />
93            <Route
94              path="/admin/orders"
95              element={isManager ? <ManagerOrdersPage token={token} /> : <Navigate to="/login" replace />}
96            />
97          </Routes>
98        </div>
99
100       <Footer />
101     </CartProvider>
102   );
103 };
104
105 export default App;
```

- **стр. 69** — всё обёрнуто в `CartProvider`: любая страница внутри может получить корзину через `useCart()`. Передаём ему `token`, чтобы корзина знала, брать её с сервера (вошёл) или из браузера (гость).
- **стр. 70** — шапка. Ей передаются токен, функции `setToken` и `setUser` (для кнопки «выйти») и пользователь (для имени и ссылки MANAGE).
- **стр. 73** — `Routes` смотрит на адрес в браузере и рисует **один** подходящий `Route`.
- **стр. 74–88** — маршруты: `path` — адрес, `element` — что нарисовать.
  - **стр. 80** — странице входа передаём `setToken` и `setUser`: после входа она запишет туда токен и пользователя, и весь сайт сразу узнает, что человек вошёл.
  - **стр. 86** — `/products/:id` — `:id` — переменная часть: для `/products/65f1bbb` страница достанет `65f1bbb` через `useParams()`.
- **стр. 89–92** — страница управления товарами. `element` выбирается тернарным оператором: менеджер — `ManagerProductsPage` (с токеном для запросов), иначе — `<Navigate to="/login" replace />`: перенаправить на вход. `replace` — заменить адрес в истории, чтобы кнопка «назад» не возвращала на закрытую страницу.
- **стр. 93–96** — страница заказов — так же.
- Это защита только для удобства: даже если обойти её в браузере, сервер всё равно проверит роль (`restrictTo`) и не отдаст данные.
- **стр. 100** — подвал.
- **стр. 105** — отдаём `App` наружу (`export default` — главный экспорт файла).

## 8.10 front/src/context/CartContext.jsx — корзина для всего сайта

**Что это за файл.** Корзина, которую видит любая страница: шапка (число товаров), каталог (кнопка Add to Cart), страница корзины, оформление заказа.
**Кто подключает:** `App.jsx` (`CartProvider`), `Header`, `BeadedBagsPage`, `BraceletsPage`, `ProductDetailPage`, `CustomStudioPage`, `CartPage`, `CheckoutPage`, `OrderSuccessPage` (`useCart`).
**Что подключает:** из `react` — `createContext`, `useContext`, `useState`, `useEffect`, `useRef` (стр. 1); из `api.jsx` — `api`, `imageUrl`, `authHeader` (стр. 2).

**Где лежит корзина — три места:**
| Кто | Товары каталога | Сумки из конструктора |
|---|---|---|
| Гость (не вошёл) | `localStorage`, ключ `guestCart` | там же, `guestCart` |
| Вошедший | на сервере, в базе (`/api/cart`) | `localStorage`, ключ `customItems` |

Сумки из конструктора не попадают на сервер, потому что серверная корзина хранит только ссылки на товары каталога, а такой сумки в каталоге нет.

**Одна позиция корзины на сайте** всегда выглядит одинаково, откуда бы она ни пришла:
`{ id: '65f1bbb', name: 'Pink Bag', category: 'bags', image: 'http://.../uploads/pink.jpg', price: 180, quantity: 2 }`

### Подготовка и помощники (стр. 1–49)

```jsx
1  import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
2  import api, { imageUrl, authHeader } from '../api';
3
4  // A context lets every page read the cart without passing it down as a prop.
5  const CartContext = createContext();
6
7  // A visitor who is not signed in still gets a cart; it lives in this browser.
8  const GUEST_KEY = 'guestCart';
9
10 const loadGuestCart = () => {
11   try {
12     return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
13   } catch {
14     return [];
15   }
16 };
17
18 const saveGuestCart = (items) => {
19   localStorage.setItem(GUEST_KEY, JSON.stringify(items));
20 };
```

- **стр. 5** — `createContext()` создаёт «канал» — контекст. Через него компонент-«раздатчик» (`CartProvider`) передаёт данные всем компонентам внутри себя, и не нужно передавать корзину через пропсы от страницы к странице.
- **стр. 8** — `GUEST_KEY` — имя, под которым гостевая корзина лежит в `localStorage`.
- **стр. 10** — `loadGuestCart()` — прочитать гостевую корзину.
- **стр. 12** — `localStorage.getItem('guestCart')` — строка или `null`; `JSON.parse` — в массив; `|| []` — если ничего нет (`null`), пустой массив.
- **стр. 13–15** — строка испорчена — `JSON.parse` бросит ошибку — возвращаем пустой массив, а не роняем сайт.
- **стр. 18–20** — `saveGuestCart(items)` — сохранить: `JSON.stringify(массив)` превращает массив в строку, `localStorage.setItem(ключ, строка)` — записывает.

```jsx
22 // A bag from the Custom Studio is not a product from the catalog, so the
23 // server cart cannot hold it. For a signed in user it lives in this browser.
24 const CUSTOM_KEY = 'customItems';
25
26 const loadCustomItems = () => {
27   try {
28     return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
29   } catch {
30     return [];
31   }
32 };
33
34 const saveCustomItems = (items) => {
35   localStorage.setItem(CUSTOM_KEY, JSON.stringify(items));
36 };
37
38 // Custom bags get an id like "custom-1718000000000".
39 const isCustom = (id) => String(id).startsWith('custom-');
40
41 // Turns one row of the server cart into the simple shape the pages display.
42 const toCartItem = (item) => ({
43   id: item.product._id,
44   name: item.product.model_name,
45   category: item.product.category,
46   image: imageUrl(item.product.file_name),
47   price: item.product.price,
48   quantity: item.quantity
49 });
```

- **стр. 24–36** — то же самое для кастомных сумок вошедшего пользователя, под ключом `customItems`.
- **стр. 39** — `isCustom(id)` — сумка ли это из конструктора: её id начинается с `custom-` (так его создаёт `CustomStudioPage`, стр. 213). `String(id)` — на случай, если id не строка (у `startsWith` должна быть строка).
- **стр. 42–49** — `toCartItem(item)` — перевести строку серверной корзины в «сайтовый» вид. Сервер присылает `{ product: { _id, model_name, category, file_name, price }, quantity }`; функция возвращает плоский объект:
  - **стр. 43** — `id` — id товара;
  - **стр. 44** — `name` — название;
  - **стр. 45** — категория;
  - **стр. 46** — полный адрес картинки через `imageUrl` (сервер хранит только `uploads/xxx.jpg`);
  - **стр. 47** — цена;
  - **стр. 48** — количество.
  - Стрелочная функция с `({ ... })` сразу возвращает объект.

### Компонент `CartProvider` (стр. 51–256)

- **Получает:** `children` — всё, что написано внутри `<CartProvider>...</CartProvider>` в `App.jsx` (шапка, страницы, подвал); `token` — токен входа или `null`.

```jsx
51 const CartProvider = ({ children, token }) => {
52   const [items, setItems] = useState([]);
53
54   // Remembers the previous token, so we can tell a fresh login from a redraw.
55   const prevToken = useRef(null);
56
```

- **стр. 51** — компонент. `({ children, token })` — деструктуризация пропсов.
- **стр. 52** — `items` — позиции корзины, которые видят страницы. Сначала пустой массив.
- **стр. 55** — `useRef(null)` — «коробка» для значения, которое переживает перерисовки, но в отличие от `useState` **не вызывает** перерисовку при изменении. Значение лежит в `prevToken.current`. Здесь хранится токен с прошлого раза — по нему отличаем «только что вошёл» от обычной перерисовки.

#### Функция `fetchCart()` (стр. 58–72) — загрузить корзину

```jsx
57   // Signed in: read the cart from the server. Guest: read it from this browser.
58   const fetchCart = () => {
59     if (!token) {
60       setItems(loadGuestCart());
61       return;
62     }
63
64     api
65       .get('/api/cart', authHeader(token))
66       .then((response) => {
67         setItems([...response.data.data.items.map(toCartItem), ...loadCustomItems()]);
68       })
69       .catch((error) => {
70         console.log(error);
71       });
72   };
```

- **Кто вызывает:** эффект (стр. 80, 87, 107), `addToCart` (стр. 137), `removeFromCart` (стр. 162), `updateQuantity` при ошибке (стр. 209), `clearCart` (стр. 225).
- **стр. 59–62** — гость: берём корзину из браузера, кладём в состояние (`setItems` — React перерисует всех, кто показывает корзину) и выходим.
- **стр. 64–65** — вошедший: `GET /api/cart` с токеном. На сервере — `getCart`.
- **стр. 66** — ответ пришёл: `response.data.data` — корзина, `.items` — её строки.
- **стр. 67** — новый массив из двух частей. `...` («spread», «разложить») вставляет элементы одного массива в другой:
  - `...response.data.data.items.map(toCartItem)` — серверные строки, каждая переведена в сайтовый вид;
  - `...loadCustomItems()` — плюс кастомные сумки из браузера.
  - Пример: `[...[a, b], ...[c]]` → `[a, b, c]`.
- **стр. 69–71** — ошибка (сервер недоступен) — в консоль браузера.

#### Эффект: при входе и выходе (стр. 75–109)

```jsx
74    // On the first render, and again whenever the user logs in or out.
75    useEffect(() => {
76      const justLoggedIn = token && !prevToken.current;
77      prevToken.current = token;
78
79      if (!justLoggedIn) {
80        fetchCart();
81        return;
82      }
83
84      // The visitor filled a cart before logging in, so move it to the server.
85      const guestItems = loadGuestCart();
86      if (guestItems.length === 0) {
87        fetchCart();
88        return;
89      }
90
91      // Custom bags cannot go to the server, so they move to their own list.
92      const customItems = guestItems.filter((item) => isCustom(item.id));
93      saveCustomItems([...loadCustomItems(), ...customItems]);
94
95      // The server adds one unit per request, so a product with quantity 3
96      // is sent 3 times.
97      const products = guestItems.filter((item) => !isCustom(item.id));
98      const requests = [];
99      for (const item of products) {
100       for (let i = 0; i < item.quantity; i++) {
101         requests.push(api.post('/api/cart', { productId: item.id }, authHeader(token)));
102       }
103     }
104
105     Promise.allSettled(requests).then(() => {
106       localStorage.removeItem(GUEST_KEY);
107       fetchCart();
108     });
109   }, [token]);
```

- **стр. 109** — `[token]` — эффект срабатывает при первой отрисовке и каждый раз, когда меняется токен (вход, выход).
- **стр. 76** — `justLoggedIn` — «только что вошёл»: токен есть сейчас (`token`) **и** (`&&`) раньше его не было (`!prevToken.current`).
- **стр. 77** — запоминаем текущий токен на следующий раз.
- **стр. 79–82** — это не вход (первая загрузка страницы или выход) — просто загружаем корзину (`fetchCart` сам решит, откуда) и выходим из эффекта.
- **стр. 85** — человек только что вошёл. Может быть, он набрал товары, пока был гостем, — читаем гостевую корзину.
- **стр. 86–89** — она пустая — переносить нечего: загружаем серверную корзину и выходим.
- **стр. 92** — `filter` — выбрать из гостевой корзины кастомные сумки.
- **стр. 93** — добавить их к уже сохранённым кастомным сумкам этого пользователя: `[...старые, ...новые]`.
- **стр. 97** — товары каталога из гостевой корзины (`!isCustom` — не кастомные).
- **стр. 98** — пустой список запросов.
- **стр. 99** — внешний цикл: по каждому товару.
- **стр. 100–102** — внутренний цикл: столько раз, сколько штук этого товара (`i` от 0 до `quantity − 1`). Каждый раз добавляем в список запрос `POST /api/cart` с id товара — сервер добавляет по одной штуке. Товар с количеством 3 — три запроса. `api.post(...)` сразу отправляет запрос и возвращает Promise — его мы и кладём в список.
- **стр. 105** — `Promise.allSettled(список)` ждёт, пока закончатся **все** запросы — даже если какие-то упали (в отличие от `Promise.all`, который остановился бы на первой ошибке).
- **стр. 106** — гостевую корзину стираем: всё уже на сервере.
- **стр. 107** — загружаем итоговую корзину с сервера.

#### Функция `addToCart(product)` (стр. 111–143) — добавить товар каталога

- **Кто вызывает:** кнопки Add to Cart в `BeadedBagsPage`, `BraceletsPage`, `ProductDetailPage`.
- **Получает:** товар в том виде, как его вернул сервер (`_id`, `model_name`, `category`, `file_name`, `price`).

```jsx
111   const addToCart = (product) => {
112     if (!token) {
113       const guest = loadGuestCart();
114       const existing = guest.find((item) => item.id === product._id);
115
116       if (existing) {
117         existing.quantity += 1;
118       } else {
119         guest.push({
120           id: product._id,
121           name: product.model_name,
122           category: product.category,
123           image: imageUrl(product.file_name),
124           price: product.price,
125           quantity: 1
126         });
127       }
128
129       saveGuestCart(guest);
130       setItems([...guest]);
131       return;
132     }
133
134     api
135       .post('/api/cart', { productId: product._id }, authHeader(token))
136       .then(() => {
137         fetchCart();
138       })
139       .catch((error) => {
140         console.log(error);
141         alert(error.response?.data?.message || 'Failed to add to cart');
142       });
143   };
```

- **стр. 112** — гость:
  - **стр. 113** — читаем гостевую корзину;
  - **стр. 114** — `find` ищет в ней строку с этим товаром (`item.id === product._id`) и возвращает **саму строку** или `undefined`;
  - **стр. 116–117** — нашлась — прибавляем 1 к количеству. `existing` — ссылка на объект внутри массива `guest`, поэтому меняется и сам массив;
  - **стр. 118–126** — нет — `push` добавляет новую строку в сайтовом виде, количество 1;
  - **стр. 129** — сохраняем в браузере;
  - **стр. 130** — `setItems([...guest])` — кладём в состояние **копию** массива. Копия нужна: React перерисовывает, только если получил новый массив, а не тот же самый изменённый;
  - **стр. 131** — выходим.
- **стр. 134–135** — вошедший: `POST /api/cart` с `{ productId }` и токеном → на сервере `addToCart`.
- **стр. 136–138** — получилось — перечитываем корзину с сервера.
- **стр. 139–142** — не получилось — в консоль и `alert` (всплывающее окно браузера) с текстом от сервера. `error.response?.data?.message` — `?.` на каждом шаге: если ответа нет вообще (сервер недоступен), получится `undefined`, и `||` подставит `'Failed to add to cart'`.

#### Функция `removeFromCart(productId)` (стр. 145–167) — удалить позицию

- **Кто вызывает:** `CartPage` — иконка мусорки.

```jsx
145   const removeFromCart = (productId) => {
146     if (!token) {
147       const guest = loadGuestCart().filter((item) => item.id !== productId);
148       saveGuestCart(guest);
149       setItems(guest);
150       return;
151     }
152
153     if (isCustom(productId)) {
154       saveCustomItems(loadCustomItems().filter((item) => item.id !== productId));
155       setItems(items.filter((item) => item.id !== productId));
156       return;
157     }
158
159     api
160       .delete(`/api/cart/${productId}`, authHeader(token))
161       .then(() => {
162         fetchCart();
163       })
164       .catch((error) => {
165         console.log(error);
166       });
167   };
```

- **стр. 146–151** — гость: `filter` оставляет все строки, кроме удаляемой (`item.id !== productId`); сохраняем в браузере, кладём в состояние, выходим.
- **стр. 153–157** — вошедший, но это кастомная сумка (она не на сервере):
  - **стр. 154** — убираем её из `customItems` в браузере;
  - **стр. 155** — и из состояния;
  - **стр. 156** — выходим.
- **стр. 159–160** — вошедший, товар каталога: `DELETE /api/cart/<id>` → на сервере `removeFromCart`.
- **стр. 161–163** — получилось — перечитываем корзину.
- **стр. 164–166** — ошибка — в консоль.

#### Функция `addCustomItem(item)` (стр. 171–180) — добавить сумку из конструктора

- **Кто вызывает:** `CustomStudioPage` (`handleAddToCart`, стр. 210).
- **Получает:** готовую позицию `{ id: 'custom-1718...', name, price, image, category: 'custom', quantity: 1, config: {...} }`.

```jsx
169   // A bag built in the Custom Studio is not a product from the catalog,
170   // so it is kept only in this browser.
171   const addCustomItem = (item) => {
172     const updated = [...items, item];
173     setItems(updated);
174
175     if (!token) {
176       saveGuestCart(updated);
177       return;
178     }
179     saveCustomItems([...loadCustomItems(), item]);
180   };
```

- **стр. 172** — новый массив: все прежние позиции плюс новая в конце.
- **стр. 173** — в состояние — сумка сразу видна в корзине.
- **стр. 175–178** — гость: вся корзина хранится в `guestCart`, сохраняем туда весь новый массив и выходим.
- **стр. 179** — вошедший: кастомные сумки хранятся отдельно, в `customItems` — добавляем туда только новую.

#### Функция `updateQuantity(id, newQuantity)` (стр. 182–211) — изменить количество

- **Кто вызывает:** `CartPage` — кнопки − и +.

```jsx
182   const updateQuantity = (id, newQuantity) => {
183     if (newQuantity < 1) return;
184
185     // A new list where only the changed item gets the new quantity.
186     const updated = items.map((item) => {
187       if (item.id === id) {
188         return { ...item, quantity: newQuantity };
189       }
190       return item;
191     });
192     setItems(updated);
193
194     if (!token) {
195       saveGuestCart(updated);
196       return;
197     }
198
199     if (isCustom(id)) {
200       saveCustomItems(updated.filter((item) => isCustom(item.id)));
201       return;
202     }
203
204     // The new number is already on the screen; the server keeps it for next time.
205     api
206       .patch(`/api/cart/${id}`, { quantity: newQuantity }, authHeader(token))
207       .catch((error) => {
208         console.log(error);
209         fetchCart();
210       });
211   };
```

- **стр. 183** — меньше 1 нельзя: выйти, ничего не меняя (для удаления есть мусорка).
- **стр. 186** — `map` строит новый массив, проходя по каждой позиции.
- **стр. 187–189** — нужная позиция — возвращаем её копию с новым количеством (`{ ...item, quantity: newQuantity }` — все поля старой позиции плюс новое `quantity`).
- **стр. 190** — остальные позиции — без изменений.
- **стр. 192** — сразу показываем на экране.
- **стр. 194–197** — гость — сохраняем в браузере и выходим.
- **стр. 199–202** — кастомная сумка вошедшего — сохраняем все кастомные позиции в `customItems` (`filter` выбирает из нового массива только их) и выходим.
- **стр. 205–206** — товар каталога вошедшего — `PATCH /api/cart/<id>` с `{ quantity }` → на сервере `updateQuantity`. Ответ не ждём: число на экране уже новое.
- **стр. 207–210** — не получилось — перечитываем корзину с сервера, чтобы на экране было правильное число.

#### Функция `clearCart()` (стр. 213–230) — очистить корзину

- **Кто вызывает:** `CartPage` (кнопка Clear all items), `OrderSuccessPage` (после оплаты).

```jsx
213   const clearCart = () => {
214     setItems([]);
215
216     if (!token) {
217       localStorage.removeItem(GUEST_KEY);
218       return;
219     }
220
221     localStorage.removeItem(CUSTOM_KEY);
222     api
223       .delete('/api/cart', authHeader(token))
224       .then(() => {
225         fetchCart();
226       })
227       .catch((error) => {
228         console.log(error);
229       });
230   };
```

- **стр. 214** — сразу пустая корзина на экране.
- **стр. 216–219** — гость — удаляем `guestCart` из браузера (`removeItem`) и выходим.
- **стр. 221** — вошедший — удаляем кастомные сумки из браузера.
- **стр. 222–223** — `DELETE /api/cart` → на сервере `clearCart`.
- **стр. 224–226** — получилось — перечитываем (придёт пустая корзина).
- **стр. 227–229** — ошибка — в консоль.

#### Итоги и раздача (стр. 232–261)

```jsx
232   const getTotalPrice = () => {
233     return items.reduce((total, item) => total + item.price * item.quantity, 0);
234   };
235
236   const getTotalItems = () => {
237     return items.reduce((total, item) => total + item.quantity, 0);
238   };
239
240   return (
241     <CartContext.Provider
242       value={{
243         items,
244         addToCart,
245         addCustomItem,
246         removeFromCart,
247         updateQuantity,
248         getTotalPrice,
249         clearCart,
250         getTotalItems
251       }}
252     >
253       {children}
254     </CartContext.Provider>
255   );
256 };
257
258 // Short way for a page to read the cart: const { items } = useCart();
259 const useCart = () => useContext(CartContext);
260
261 export { CartProvider, useCart };
```

- **стр. 232–234** — `getTotalPrice()` — сумма корзины. `reduce` проходит по позициям и держит накопитель `total`: начальное значение `0` (второй аргумент), к нему для каждой позиции прибавляется `цена × количество`. Пример: 180 × 2 + 210 × 1 = 570.
- **стр. 236–238** — `getTotalItems()` — сколько всего штук (сумма количеств) — это число на значке корзины в шапке.
- **стр. 241** — `<CartContext.Provider value={...}>` — «раздатчик»: всё, что внутри, может получить объект `value`.
- **стр. 242–251** — `value` — объект с корзиной и функциями. Двойные фигурные скобки: внешние — «здесь JS-выражение», внутренние — сам объект. `items` — короткая запись `items: items`.
- **стр. 253** — `{children}` — рисуем всё, что было внутри `<CartProvider>` в `App.jsx`.
- **стр. 259** — `useCart()` — свой хук: `useContext(CartContext)` достаёт объект `value` из «канала». Страница пишет `const { items, addToCart } = useCart();` и получает нужное.
- **стр. 261** — отдаём наружу `CartProvider` и `useCart` (именованный экспорт — подключают в фигурных скобках).

# Часть 9. Сайт: шапка и подвал

## 9.1 front/src/shared/ui/Header.jsx — шапка

**Что это за файл.** Чёрная полоса сверху на каждой странице: ссылки на разделы, вход/выход, корзина с числом товаров, меню-«гамбургер» на телефоне.
**Кто подключает:** `App.jsx` (стр. 6, 70).
**Что подключает:** `useState` (стр. 1); `NavLink`, `useNavigate` из `react-router-dom` (стр. 2); иконки из `lucide-react` (стр. 3); `useCart` (стр. 4).

### Данные и функции (стр. 6–35)

```jsx
1  import React, { useState } from 'react';
2  import { NavLink, useNavigate } from "react-router-dom";
3  import { ShoppingBag, User, LogOut, Menu, X } from "lucide-react";
4  import { useCart } from "../../context/CartContext";
5
6  const Header = ({ token, setToken, setUser, user }) => {
7    const navigate = useNavigate();
8    const [menuOpen, setMenuOpen] = useState(false);
9
10   const { getTotalItems } = useCart();
11
12   const baseClass =
13     "text-[#f5efe8] no-underline text-[18px] tracking-[0.18em]";
14
15   const isManager = user?.role === "manager" || user?.role === "admin";
16
17   const links = [
18     { to: "/beaded-bags", label: "BEADED BAGS" },
19     { to: "/about", label: "ABOUT" },
20     { to: "/", label: "HOME", end: true },
21     { to: "/bracelets", label: "BRACELETS" },
22     { to: "/custom-studio", label: "CUSTOM STUDIO" },
23     ...(isManager ? [{ to: "/admin", label: "MANAGE" }] : []),
24   ];
25
26   const handleLogout = () => {
27     localStorage.removeItem("token");
28     localStorage.removeItem("user");
29     // Custom bags of this account must not stay for the next person on this browser.
30     localStorage.removeItem("customItems");
31     setToken(null);
32     setUser?.(null);
33     setMenuOpen(false);
34     navigate("/");
35   };
```

- **стр. 2** — `NavLink` — ссылка на страницу сайта без перезагрузки (как `<a>`, но переход делает React). Отличается от `Link` тем, что знает, активна ли ссылка сейчас. `useNavigate` — хук, который даёт функцию «перейти на адрес» из кода.
- **стр. 3** — иконки-компоненты: сумка, человечек, выход, меню (три полоски), крестик.
- **стр. 6** — компонент `Header`. Пропсы из `App.jsx`: `token` (вошёл ли), `setToken`, `setUser` (чтобы при выходе всё обнулить), `user` (кто вошёл).
- **стр. 7** — `navigate` — функция перехода: `navigate('/')` — на главную.
- **стр. 8** — `menuOpen` — открыто ли мобильное меню. Сначала `false` — закрыто.
- **стр. 10** — из корзины берём только функцию `getTotalItems` — сколько всего штук.
- **стр. 12–13** — общие классы оформления ссылок (цвет, размер, расстояние между буквами), чтобы не повторять их в каждой ссылке.
- **стр. 15** — `isManager` — роль `manager` или `admin`. `user?.role` — если пользователя нет, `undefined`, а не ошибка.
- **стр. 17–24** — массив ссылок: `to` — адрес, `label` — текст. Из него на стр. 50 и 104 рисуются ссылки.
  - **стр. 20** — `end: true` у главной: `NavLink` с адресом `/` считался бы активным на **любой** странице (все адреса начинаются с `/`). `end` — «активна только при точном совпадении».
  - **стр. 23** — ссылка MANAGE — только для менеджера. Разбор: `isManager ? [ссылка] : []` — менеджеру массив из одной ссылки, остальным пустой массив; `...` перед ним раскладывает этот массив внутрь списка. Для менеджера добавится одна ссылка, для остальных — ничего.
- **стр. 26** — `handleLogout` — кнопка «Выйти».
- **стр. 27–28** — удаляем из браузера токен и сохранённого пользователя.
- **стр. 30** — удаляем кастомные сумки этого аккаунта, чтобы их не увидел следующий человек за этим компьютером.
- **стр. 31** — токен в состоянии `App` — `null`. `App` перерисуется: корзина переключится на гостевую, страницы менеджера закроются.
- **стр. 32** — пользователь — `null`. `setUser?.(null)` — `?.` перед скобками: вызвать функцию, только если её передали (иначе пропустить без ошибки).
- **стр. 33** — закрыть мобильное меню.
- **стр. 34** — перейти на главную.

### Разметка (стр. 37–121)

```jsx
37   return (
38     <header className="w-full bg-black">
39       <div className="w-full max-w-[1512px] mx-auto px-[20px] md:px-[42px] h-[90px] flex items-center justify-between gap-4">
40         <button
41           type="button"
42           onClick={() => setMenuOpen((v) => !v)}
43           className="md:hidden text-[#f5efe8] bg-transparent border-none cursor-pointer p-1"
44           aria-label="Toggle menu"
45         >
46           {menuOpen ? <X size={28} /> : <Menu size={28} />}
47         </button>
48
49         <nav className="hidden md:flex md:flex-1 items-center justify-between gap-4 md:mr-8 lg:mr-12">
50           {links.map((l) => (
51             <NavLink key={l.to} to={l.to} end={l.end} className={baseClass}>
52               {l.label}
53             </NavLink>
54           ))}
55         </nav>
56
```

- **стр. 38** — `<header>` — чёрная полоса на всю ширину.
- **стр. 39** — внутренний блок: по центру, не шире 1512px, высота 90px, элементы в ряд с промежутками (`flex justify-between`).
- **стр. 40–47** — кнопка меню, видна только на телефоне (`md:hidden` — спрятать начиная со средних экранов).
  - **стр. 42** — `onClick={() => setMenuOpen((v) => !v)}` — при нажатии переключить: в `setMenuOpen` передаём функцию, которая получает старое значение `v` и возвращает противоположное (`!v`): было закрыто — открыть, было открыто — закрыть.
  - **стр. 44** — `aria-label` — подпись для экранных дикторов (у кнопки нет текста, только иконка).
  - **стр. 46** — меню открыто — крестик, закрыто — три полоски (тернарный оператор).
- **стр. 49–55** — ссылки для широких экранов (`hidden md:flex` — на телефоне скрыто).
  - **стр. 50** — `links.map((l) => ...)` — для каждой ссылки из массива (стр. 17–24) нарисовать `NavLink`. `l` — текущая ссылка.
  - **стр. 51** — `key={l.to}` — уникальный ключ: React по нему понимает, какой элемент списка какой. `to` — адрес, `end` — точное совпадение (только у главной).
  - **стр. 52** — текст ссылки.

```jsx
57          <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
58            {token ? (
59              <button
60                onClick={handleLogout}
61                className="flex items-center gap-2 text-[#f5efe8] no-underline transition-opacity duration-300 hover:opacity-70 cursor-pointer bg-transparent border-none"
62                style={{ fontFamily: "Centaur, serif" }}
63              >
64                <LogOut size={28} strokeWidth={1.75} />
65                <span className="hidden sm:inline text-[20px] tracking-[2px] leading-none">
66                  Logout
67                </span>
68              </button>
69            ) : (
70              <NavLink
71                to="/login"
72                className="flex items-center gap-2 text-[#f5efe8] no-underline transition-opacity duration-300 hover:opacity-70"
73                style={{ fontFamily: "Centaur, serif" }}
74              >
75                <User size={30} strokeWidth={1.75} />
76                <span className="hidden sm:inline text-[20px] tracking-[2px] leading-none">
77                  Login
78                </span>
79              </NavLink>
80            )}
81
82            <NavLink
83              to="/cart"
84              className="relative flex items-center gap-2 text-[#f5efe8] no-underline transition-opacity duration-300 hover:opacity-70"
85              style={{ fontFamily: "Centaur, serif" }}
86            >
87              <div className="relative">
88                <ShoppingBag size={30} strokeWidth={1.75} />
89
90                <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#f5efe8] px-[4px] text-[10px] text-black leading-none">
91                  {getTotalItems ? getTotalItems() : 0}
92                </span>
93              </div>
94
95              <span className="hidden sm:inline text-[20px] tracking-[2px] leading-none">
96                Cart
97              </span>
98            </NavLink>
99          </div>
100       </div>
```

- **стр. 57** — правый блок: вход/выход и корзина.
- **стр. 58** — `{token ? (...) : (...)}` — вошёл — кнопка «Logout» (стр. 59–68), не вошёл — ссылка «Login» (стр. 70–79).
  - **стр. 60** — нажатие — `handleLogout` (стр. 26). Без скобок: передаём саму функцию, React вызовет её при нажатии.
  - **стр. 64** — иконка выхода; **стр. 65–67** — слово «Logout», скрыто на очень узких экранах (`hidden sm:inline`).
  - **стр. 71** — ссылка ведёт на `/login`.
- **стр. 82–98** — ссылка на корзину.
  - **стр. 88** — иконка сумки.
  - **стр. 90–92** — кружок с числом поверх иконки (`absolute -right-2 -top-2` — в правом верхнем углу). Число: `getTotalItems ? getTotalItems() : 0` — если функция есть, вызвать её (сумма количеств в корзине), иначе 0.

```jsx
102       {menuOpen && (
103         <nav className="md:hidden flex flex-col bg-black border-t border-white/10 px-[20px] pb-4">
104           {links.map((l) => (
105             <NavLink
106               key={l.to}
107               to={l.to}
108               end={l.end}
109               onClick={() => setMenuOpen(false)}
110               className={`${baseClass} py-4 border-b border-white/5`}
111             >
112               {l.label}
113             </NavLink>
114           ))}
115         </nav>
116       )}
117     </header>
118   );
119 };
120
121 export default Header;
```

- **стр. 102** — `{menuOpen && (...)}` — мобильное меню рисуется, только если `menuOpen` — `true`. `&&`: если слева `false`, React ничего не рисует.
- **стр. 103** — меню столбиком (`flex-col`), только на телефоне.
- **стр. 104–114** — те же ссылки из массива `links`, но:
  - **стр. 109** — при нажатии на ссылку меню закрывается;
  - **стр. 110** — классы: общие из `baseClass` плюс отступы и линия снизу. Шаблонная строка `` `${baseClass} py-4 ...` `` склеивает их.
- **стр. 121** — отдаём компонент наружу.

## 9.2 front/src/shared/ui/Footer.jsx — подвал

**Кто подключает:** `App.jsx` (стр. 7, 100). **Что подключает:** React, `NavLink`.
Логики нет — только разметка.

- **стр. 5–6** — `sectionTitleClass` — общие стили заголовков колонок.
- **стр. 8–9** — `footerLinkClass` — общие стили ссылок.
- **стр. 12** — `<footer>`, чёрный фон, отступы.
- **стр. 14** — сетка: 1 колонка на телефоне, 2 на планшете, 4 на компьютере.
- **стр. 16–29** — колонка 1: название DARIN'S и одна фраза.
- **стр. 31–47** — колонка SHOP: ссылки `NavLink` на `/beaded-bags`, `/bracelets`, `/custom-studio`.
- **стр. 49–59** — колонка INFO: ссылка на `/about`.
- **стр. 61–80** — колонка SOCIALS: обычные ссылки `<a>` на Instagram, Etsy, Facebook, TikTok. `target="_blank"` — открыть в новой вкладке; `rel="noopener noreferrer"` — новая вкладка не получит доступ к нашей (защита).
- **стр. 83** — разделительная линия.
- **стр. 85–110** — нижняя строка: копирайт и ссылки на `/privacy-policy` и `/terms-of-service`.

---

# Часть 10. Сайт: главная страница (pages/home/)

## 10.1 HomePage.jsx — главная, собирает четыре секции

**Кто подключает:** `App.jsx` (адрес `/`).
**Что подключает:** `useRef` (стр. 1) и четыре секции из этой же папки (стр. 2–5).

```jsx
7  const HomePage = () => {
8      const categoriesRef = useRef(null);
9
10     const handleScrollToCategories = () => {
11         categoriesRef.current?.scrollIntoView({
12             behavior: "smooth",
13             block: "start",
14         });
15     };
16
17     return (
18         <div className="home-page">
19             <HeroSection onShopClick={handleScrollToCategories} />
20             <AboutSection />
21             <CustomBagSection />
22             <CategoriesSection categoriesRef={categoriesRef} />
23         </div>
24     );
25 };
```

- **стр. 8** — `useRef(null)` — «ссылка» на HTML-элемент секции категорий. Сама секция привяжет её к себе (`CategoriesSection`, стр. 14).
- **стр. 10–15** — **функция `handleScrollToCategories()`** — плавно прокрутить страницу к категориям. `categoriesRef.current` — сам HTML-элемент; `scrollIntoView` — встроенный метод браузера; `behavior: "smooth"` — плавно; `block: "start"` — верх секции к верху экрана. Вызывается кнопкой SHOP в `HeroSection`.
- **стр. 19** — первая секция; ей передаём функцию прокрутки как проп `onShopClick`.
- **стр. 20–21** — вторая и третья секции, без пропсов.
- **стр. 22** — секция категорий; ей передаём `ref`, чтобы она к нему привязалась.

**Что такое `motion` (во всех секциях ниже).** Библиотека `framer-motion`. `motion.div`, `motion.h1`, `motion.img` и т.д. — обычные теги с анимацией. Атрибуты: `initial` — как выглядит в начале (`opacity: 0` — прозрачный, `y: 30` — сдвинут на 30px вниз); `animate` — к чему прийти; `whileInView` — анимировать, когда элемент появился на экране при прокрутке; `viewport={{ once: true }}` — только один раз; `transition` — длительность (`duration`, секунды), задержка (`delay`) и кривая скорости (`ease`); `whileHover` / `whileTap` — при наведении / нажатии.

## 10.2 HeroSection.jsx — первый экран

**Что подключает:** `useState` (стр. 1), `Link` (стр. 2), `motion` (стр. 3), картинку `pinkBag.png` (стр. 4 — Vite превратит импорт картинки в её адрес).
**Пропсы:** `onShopClick` — функция прокрутки из `HomePage`.

- **стр. 7** — `shopHovered` — наведена ли мышь на кнопку SHOP (для анимации).
- **стр. 10–11** — секция на всю ширину, светлый фон; внутри две колонки (на телефоне — одна под другой).
- **стр. 12–93** — левая колонка (58% ширины):
  - **стр. 13–21** — огромный заголовок «EXCLUSIVE HANDMADE», выезжает снизу и проявляется за 0,8 с.
  - **стр. 23–28** — чёрная полоса под заголовком, «вырастает» слева направо (`scaleX` от 0 до 1, `originX: 0` — от левого края).
  - **стр. 30–40** — подпись «BY DARIN'S» и короткая полоса.
  - **стр. 42–92** — две кнопки:
    - **стр. 48–77** — кнопка SHOP (`motion.button`). **стр. 50** `onClick={onShopClick}` — вызывает прокрутку из `HomePage`. **стр. 51–52** — при наведении `setShopHovered(true)`, при уходе — `false`. **стр. 53** — при нажатии чуть уменьшается. **стр. 57–62** — светлый круг внутри, появляется при наведении. **стр. 63–76** — текст SHOP: при наведении буквы раздвигаются (`letterSpacing`), справа выезжает стрелка `→`.
    - **стр. 79–91** — ссылка CUSTOM на `/custom-studio` (`Link` — переход без перезагрузки страницы).
- **стр. 95–108** — правая колонка: фото розовой сумки, выезжает справа; при наведении чуть увеличивается и поворачивается.

## 10.3 AboutSection.jsx — «Уникальность в деталях»

**Что подключает:** `motion` (стр. 2), картинку `AboutSectionBag.png` (стр. 3). Логики нет.

- **стр. 7** — секция; `-mt-[...]` — отрицательный верхний отступ, чтобы секция чуть «наехала» на предыдущую.
- **стр. 9–23** — фото чёрной сумки слева; выезжает слева при появлении на экране (`whileInView`).
- **стр. 25–49** — справа заголовок «Uniqueness in the details» (стр. 26–35) и абзац текста (стр. 37–48), оба проявляются снизу при прокрутке.

## 10.4 CustomBagSection.jsx — «Создай свой дизайн»

**Что подключает:** `useState` (стр. 1), `Link` (стр. 2), `motion` и `AnimatePresence` (стр. 3), пять фото сумок разных цветов (стр. 5–9).

```jsx
11 const bagOptions = [
12   { color: "#25cfff", image: skyBag },
13   { color: "#2d46ff", image: blueBag },
14   { color: "#39c24a", image: greenBag },
15   { color: "#ff00f5", image: pinkBag },
16   { color: "#8d47ff", image: purpleBag },
17 ];
```

- **стр. 11–17** — пять вариантов: цвет кружка и фото сумки этого цвета.

```jsx
19 const CustomBagSection = () => {
20   const [selected, setSelected] = useState(0);
21   const [createHovered, setCreateHovered] = useState(false);
```

- **стр. 20** — номер выбранного цвета (сначала 0 — голубой).
- **стр. 21** — наведена ли мышь на кнопку CREATE.

- **стр. 26–82** — левая колонка: заголовок «CREATE YOUR OWN DESIGN» (стр. 33–38), текст (стр. 40–46), кнопка CREATE — ссылка на `/custom-studio` (стр. 49–80) с той же анимацией наведения, что у SHOP.
- **стр. 84–101** — средняя колонка: пять круглых кнопок-цветов. `bagOptions.map((item, i) => ...)` — по кнопке на вариант. **стр. 89** `onClick={() => setSelected(i)}` — выбрать цвет. **стр. 93–97** — `style`: фон — цвет варианта; у выбранного (`selected === i`) толстая белая рамка и свечение.
- **стр. 103–116** — правая колонка: фото выбранной сумки. **стр. 104** `AnimatePresence mode="wait"` — даёт старой картинке анимированно исчезнуть, прежде чем появится новая. **стр. 106** `key={selected}` — при смене цвета React считает картинку новой и проигрывает анимацию. **стр. 107** — `bagOptions[selected].image` — фото выбранного цвета. **стр. 110–112** — появление, состояние и исчезновение.

## 10.5 CategoriesSection.jsx — две плитки категорий

**Что подключает:** `Link`, `motion`, два фото (стр. 4–5).
**Пропсы:** `categoriesRef` — из `HomePage`.

```jsx
7  const CategoriesSection = ({ categoriesRef }) => {
8    const categories = [
9      { title: "Beaded Bags", image: rectangleWithBag, link: "/beaded-bags" },
10     { title: "Bracelets",   image: rectangleBracelets, link: "/bracelets" },
11   ];
12
13   return (
14     <section ref={categoriesRef} className="w-full bg-black">
```

- **стр. 8–11** — две категории: название, фото, адрес.
- **стр. 14** — `ref={categoriesRef}` — привязываем «ссылку» из `HomePage` к этой секции. Теперь `categoriesRef.current` — этот элемент, и кнопка SHOP может к нему прокрутить.
- **стр. 15** — сетка: одна колонка на телефоне, две на компьютере.
- **стр. 16–54** — `categories.map((item, i) => ...)` — по плитке на категорию:
  - **стр. 17–23** — появляется снизу при прокрутке; `delay: i * 0.12` — вторая чуть позже первой;
  - **стр. 24–27** — вся плитка — ссылка `Link` на страницу категории; `group` — класс Tailwind, чтобы дочерние элементы реагировали на наведение на плитку;
  - **стр. 28–32** — фото; при наведении на плитку увеличивается (`group-hover:scale-[1.06]`);
  - **стр. 34** — затемнение, при наведении сильнее;
  - **стр. 36–41** — название категории сверху по центру;
  - **стр. 43–51** — надпись «Explore →» снизу, появляется только при наведении.

---

# Часть 11. Сайт: страница «Обо мне»

## 11.1 front/src/pages/about/AboutPage.jsx

**Кто подключает:** `App.jsx` (адрес `/about`).
**Что подключает:** `useState` (стр. 1), `motion` (стр. 2), фон `background.png` (стр. 3).

```jsx
5  // Bead colors that match the beaded bags.
6  const BEAD_COLORS = ["#2F6BFF", "#1B3FD1", "#36C5F0", "#7FE3FF", "#BFEAFF", "#E8F7FF", "#9B8CFF"];
7
8  const BEAD_COUNT = 44;
9  const BEAD_SIZE_PX = { min: 8, max: 22 };
10 const FALL_SECONDS = { min: 6, max: 12 };
11 const SWAY_SECONDS = { min: 3, max: 6 };
12 const MAX_START_DELAY_S = 8;
13
14 // Random value in [min, max).
15 const rand = (min, max) => min + Math.random() * (max - min);
```

- **стр. 6** — цвета падающих бусин (оттенки синего).
- **стр. 8** — сколько бусин: 44.
- **стр. 9** — размер бусины от 8 до 22 пикселей.
- **стр. 10** — падение длится от 6 до 12 секунд.
- **стр. 11** — покачивание влево-вправо — от 3 до 6 секунд.
- **стр. 12** — начальная задержка — до 8 секунд, чтобы бусины не падали все сразу.
- **стр. 15** — **функция `rand(min, max)`** — случайное число от `min` до `max`. `Math.random()` даёт число от 0 до 1 (например 0.25); `(max - min)` — ширина промежутка; умножаем и прибавляем `min`. Пример: `rand(8, 22)` при `Math.random() = 0.25` → `8 + 0.25 × 14 = 11.5`.

```jsx
17 const AboutPage = () => {
18   // Generate the beads once, on first render (random values, so not derived from props/state).
19   const [beads] = useState(() =>
20     Array.from({ length: BEAD_COUNT }).map((_, i) => ({
21       id: i,
22       left: rand(0, 100), // % across the screen
23       duration: rand(FALL_SECONDS.min, FALL_SECONDS.max),
24       delay: rand(0, MAX_START_DELAY_S),
25       size: rand(BEAD_SIZE_PX.min, BEAD_SIZE_PX.max),
26       sway: rand(SWAY_SECONDS.min, SWAY_SECONDS.max),
27       color: BEAD_COLORS[Math.floor(rand(0, BEAD_COLORS.length))],
28     }))
29   );
```

- **стр. 19** — `useState(() => ...)` — функция вызывается **один раз** при первой отрисовке, и бусины не пересоздаются при каждой перерисовке. Функцию изменения не берём (`[beads]`) — бусины не меняются.
- **стр. 20** — массив из 44 элементов; `map((_, i) => ...)` — для каждого создаём объект бусины (`_` — значение не нужно, нужен только номер `i`).
- **стр. 21–27** — у каждой бусины:
  - **стр. 21** — `id: i` — номер (нужен для `key`);
  - **стр. 22** — `left` — позиция по горизонтали, от 0 до 100 процентов ширины экрана;
  - **стр. 23** — `duration` — сколько секунд падает (от 6 до 12);
  - **стр. 24** — `delay` — через сколько секунд начинает падать (до 8);
  - **стр. 25** — `size` — диаметр в пикселях (от 8 до 22);
  - **стр. 26** — `sway` — сколько секунд длится одно покачивание (от 3 до 6);
  - **стр. 27** — `color` — случайный цвет: `rand(0, 7)` даёт дробное число от 0 до 6.99, `Math.floor` отрезает дробь → целый номер от 0 до 6, и по нему берём цвет из массива `BEAD_COLORS`.

**Разметка (стр. 31–189):**
- **стр. 32–35** — весь экран, фоновая картинка (`backgroundImage` со ссылкой на файл).
- **стр. 36–91** — тег `<style>` с CSS прямо внутри компонента:
  - **стр. 37–42** — анимация `fall`: бусина едет сверху вниз за экран и вращается, в начале и конце прозрачная;
  - **стр. 44–47** — анимация `sway`: покачивание влево-вправо через `margin-left`;
  - **стр. 48–79** — класс `.bead`: круг, абсолютное положение, «кристальный» вид из нескольких градиентов (блик, грани, радужный отлив, основной цвет `var(--bead)`), тени, две анимации одновременно;
  - **стр. 81–90** — `.bead::after` — маленький блик на каждой бусине.
- **стр. 93** — тёмная полупрозрачная пелена поверх фона, чтобы текст читался.
- **стр. 95–108** — `beads.map(...)` — рисуем 44 `div` с классом `bead`. **стр. 99–106** — свои значения для каждой: позиция `left`, размер, цвет через CSS-переменную `--bead`, длительность и задержка двух анимаций.
- **стр. 110–187** — текст поверх бусин (`z-10` — выше):
  - **стр. 112–119** — маленькая надпись сверху;
  - **стр. 121–128** — заголовок «ABOUT ME»;
  - **стр. 130–135** — короткая линия;
  - **стр. 137** — сетка из трёх колонок: текст | линия | текст;
  - **стр. 139–151** — «Hi, I'm Darina!» и подпись;
  - **стр. 153–159** — вертикальная линия-разделитель (только на компьютере);
  - **стр. 161–182** — три абзаца о мастере: массив строк `.map(...)`, каждый абзац появляется чуть позже предыдущего (`delay: 0.7 + i * 0.12`).

---

# Часть 12. Сайт: каталоги и карточка товара

## 12.1 front/src/pages/beaded-bags/BeadedBagsPage.jsx — каталог сумок

**Что это за файл.** Страница `/beaded-bags`: загружает все товары, оставляет сумки и показывает их карточками с кнопкой Add to Cart.
**Кто подключает:** `App.jsx` (адрес `/beaded-bags`).
**Что подключает:** `useEffect`, `useState` (стр. 1), `Link` (стр. 2), `useCart` (стр. 3), `api` и `imageUrl` (стр. 4).

### Состояние и загрузка (стр. 6–25)

```jsx
1  import React, { useEffect, useState } from 'react';
2  import { Link } from "react-router-dom";
3  import { useCart } from "../../context/CartContext";
4  import api, { imageUrl } from "../../api";
5
6  const BeadedBagsPage = () => {
7    const [bags, setBags] = useState([]);
8    const [loading, setLoading] = useState(true);
9
10   const { items, addToCart } = useCart();
11
12   // Runs once when the page opens: bring the catalog and keep only the bags.
13   useEffect(() => {
14     api
15       .get("/api/products")
16       .then((response) => {
17         const bagsOnly = response.data.data.filter((product) => product.category === "bags");
18         setBags(bagsOnly);
19         setLoading(false);
20       })
21       .catch((error) => {
22         console.log(error);
23         setLoading(false);
24       });
25   }, []);
```

- **стр. 6** — компонент страницы.
- **стр. 7** — `bags` — список сумок для показа. Сначала пустой массив; `setBags` — функция, которая его заменит.
- **стр. 8** — `loading` — идёт ли загрузка. Сначала `true`: пока данных нет, показываем «Loading…».
- **стр. 10** — из корзины берём `items` (что уже в корзине — чтобы кнопка показала «In Cart») и `addToCart` (добавить).
- **стр. 13** — `useEffect(функция, [])` — выполнить функцию **после** первой отрисовки, один раз (`[]` — без зависимостей). Загружать данные прямо в теле компонента нельзя: компонент перерисовывается много раз, и запрос уходил бы снова и снова.
- **стр. 14–15** — `api.get("/api/products")` — запрос всех товаров. На сервере — `getAllProducts`. Запрос идёт асинхронно: функция сразу возвращает Promise, а ответ придёт позже.
- **стр. 16** — `.then((response) => {...})` — выполнится, когда сервер ответил. `response.data` — тело ответа `{ count, data }`; `response.data.data` — массив товаров.
- **стр. 17** — `filter` оставляет только товары с `category === "bags"`. Браслеты отсеиваются.
- **стр. 18** — кладём сумки в состояние — React перерисует страницу с карточками.
- **стр. 19** — загрузка закончена.
- **стр. 21–24** — `.catch(...)` — сервер не ответил или ответил ошибкой: пишем в консоль браузера и тоже выключаем «Loading…» (иначе надпись висела бы вечно).

### Разметка: шапка страницы (стр. 27–57)

```jsx
27   return (
28     <div className="bg-white min-h-screen">
29       <section className="relative bg-[#050000] text-white py-20 md:py-32 px-6 md:px-8">
30         <div className="max-w-[1440px] mx-auto text-center">
31           <h1 className="font-['Dorsa'] text-[56px] sm:text-[90px] md:text-[200px] tracking-[6px] md:tracking-[21.6px] leading-none mb-8">
32             BEADED BAGS
33           </h1>
34           <p className="font-['Centaur'] text-[#ccc] text-[18px] md:text-[24px] tracking-[3px] md:tracking-[4.32px] max-w-[700px] mx-auto">
35             Exquisite handcrafted beaded bags. Each bag is a work of art, meticulously designed and created by hand.
36           </p>
37         </div>
38       </section>
39
40       <section className="py-16 px-6 md:px-8 bg-[#f8f8f8]">
41         <div className="max-w-[900px] mx-auto text-center">
42           <p className="font-['Centaur'] text-[#333] text-[20px] md:text-[28px] tracking-[3px] md:tracking-[5.04px] italic leading-relaxed">
43             "A beaded bag is not just an accessory — it's a statement of elegance, craftsmanship, and timeless style."
44           </p>
45         </div>
46       </section>
47
48       <section className="py-20 px-6 md:px-8">
49         <div className="max-w-[1440px] mx-auto">
50           <div className="mb-12">
51             <h2 className="font-['Dorsa'] text-[44px] md:text-[72px] tracking-[6px] md:tracking-[12.96px] leading-none text-black mb-4">
52               Featured Collection
53             </h2>
54             <p className="font-['Centaur'] text-[#333] text-[18px] md:text-[20px] tracking-[3.6px]">
55               Discover our curated selection of beaded bags
56             </p>
57           </div>
```

- **стр. 29–38** — чёрный блок: огромный заголовок «BEADED BAGS» и подзаголовок. Только текст и оформление (`className` — классы Tailwind: шрифт, размер, отступы; `md:` — на экранах от среднего размера).
- **стр. 40–46** — серый блок с цитатой.
- **стр. 48–57** — начало блока каталога и заголовок «Featured Collection».

### Разметка: карточки товаров (стр. 59–136)

```jsx
59           {loading ? (
60             <p className="font-['Centaur'] text-[24px] text-black/60 text-center py-10">
61               Loading beautiful bags...
62             </p>
63           ) : (
64             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
65               {bags.map((bag) => {
66                 const isInCart = items.some((cartItem) => cartItem.id === bag._id);
67                 const outOfStock = bag.stock === 0;
68
69                 return (
70                   <div key={bag._id} className="group flex flex-col h-full">
71                     <div className="aspect-[4/4] bg-[#fafafa] mb-6 overflow-hidden relative border border-black/10 group">
72                       <img
73                         src={imageUrl(bag.file_name)}
74                         alt={bag.model_name}
75                         className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
76                         onError={(e) => {
77                           console.error("Image loading error:", e.target.src);
78                         }}
79                       />
80                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
81                       {typeof bag.stock === "number" && (
82                         <span className={`absolute top-3 left-3 px-3 py-1 text-[11px] tracking-[1.5px] uppercase font-['Perpetua_Titling_MT'] ${
83                           bag.stock === 0
84                             ? "bg-red-600 text-white"
85                             : bag.stock <= 3
86                               ? "bg-amber-500 text-white"
87                               : "bg-white/90 text-black"
88                         }`}>
89                           {bag.stock === 0 ? "Sold out" : bag.stock <= 3 ? `Only ${bag.stock} left` : `${bag.stock} in stock`}
90                         </span>
91                       )}
92                     </div>
```

- **стр. 59** — `{loading ? (...) : (...)}` — пока загружается — текст «Loading beautiful bags...» (стр. 60–62), иначе — сетка карточек (стр. 64–135).
- **стр. 64** — сетка: 1 колонка на телефоне, 2 на планшете, 3 на компьютере.
- **стр. 65** — `bags.map((bag) => {...})` — для каждой сумки построить карточку. Здесь у стрелочной функции **фигурные** скобки, а не круглые: внутри сначала считаем две переменные, а потом `return` разметку.
- **стр. 66** — `isInCart` — лежит ли эта сумка уже в корзине. `items.some(функция)` — проверяет, есть ли в массиве **хотя бы один** элемент, для которого функция вернёт `true`; возвращает `true` или `false`. Проверка: id позиции корзины равен id сумки (`cartItem.id === bag._id`).
- **стр. 67** — `outOfStock` — распродана ли: остаток ровно 0. (`null` — остаток не отслеживается — это **не** распродана.)
- **стр. 70** — карточка. `key={bag._id}` — уникальный ключ элемента списка.
- **стр. 72–79** — фото:
  - **стр. 73** — `src={imageUrl(bag.file_name)}` — полный адрес картинки на сервере;
  - **стр. 74** — `alt` — текст вместо картинки (если не загрузится и для экранных дикторов);
  - **стр. 75** — `group-hover:scale-110` — при наведении на карточку фото увеличивается;
  - **стр. 76–78** — `onError` — картинка не загрузилась — пишем её адрес в консоль (чтобы найти ошибку).
- **стр. 80** — прозрачный слой поверх фото, при наведении чуть затемняется.
- **стр. 81–91** — плашка остатка в углу фото. Рисуется, только если остаток отслеживается (`typeof bag.stock === "number"` — число, а не `null`; `&&` — иначе ничего не рисовать).
  - **стр. 82–88** — цвет плашки — вложенный тернарный оператор, читается как «если… иначе если… иначе»: остаток 0 — красная; иначе если 3 или меньше — оранжевая; иначе — белая.
  - **стр. 89** — текст тем же способом: `"Sold out"`, `"Only 2 left"` или `"5 in stock"`.

```jsx
94                      <div className="flex items-start justify-between mb-3">
95                        <h3 className="font-['Perpetua_Titling_MT'] text-[24px] tracking-[4.32px] text-black">
96                          {bag.model_name}
97                        </h3>
98                        <span className="font-['Centaur'] text-[14px] tracking-[2.52px] text-[#999] bg-[#f5f5f5] px-3 py-1 uppercase">
99                          {bag.style?.[0] || "Standard"}
100                       </span>
101                     </div>
102
103                     <p className="font-['Centaur'] text-[#666] text-[18px] tracking-[3.24px] mb-2 leading-relaxed">
104                       {bag.details?.[0] || "Handcrafted with love."}
105                     </p>
106
107                     <Link
108                       to={`/products/${bag._id}`}
109                       className="font-['Centaur'] text-[14px] tracking-[2.52px] text-black/50 hover:text-black transition-colors no-underline mb-4 inline-block"
110                     >
111                       View Details →
112                     </Link>
113
114                     <div className="flex items-center justify-between mt-auto">
115                       <span className="font-['Perpetua_Titling_MT'] text-[32px] tracking-[5.76px] text-black">
116                         ${bag.price || "0"}
117                       </span>
118
119                       <button
120                         onClick={() => !isInCart && !outOfStock && addToCart(bag)}
121                         disabled={outOfStock}
122                         className={`font-['Perpetua_Titling_MT'] text-[14px] tracking-[2.52px] px-8 py-3 rounded-full transition-colors border ${outOfStock
123                           ? "bg-white text-black/40 border-black/15 cursor-not-allowed"
124                           : isInCart
125                             ? "bg-white text-black border-black/30 cursor-default"
126                             : "bg-[#050000] text-white border-transparent hover:bg-[#050000]/80 cursor-pointer"
127                           }`}
128                       >
129                         {outOfStock ? "Out of Stock" : isInCart ? "In Cart" : "Add to Cart"}
130                       </button>
131                     </div>
132                   </div>
133                 );
134               })}
135             </div>
136           )}
```

- **стр. 96** — название сумки.
- **стр. 99** — метка стиля: `bag.style?.[0]` — первый элемент массива стилей. `?.[0]` — если `style` вдруг нет, получится `undefined`, а не ошибка. `|| "Standard"` — если стиля нет — слово «Standard».
- **стр. 104** — первая особенность из `details`, а если её нет — «Handcrafted with love.».
- **стр. 107–112** — ссылка «View Details →» на страницу товара: `` to={`/products/${bag._id}`} `` — шаблонная строка, получится `/products/65f1bbb`.
- **стр. 116** — цена: `$` — просто символ доллара в тексте, `{bag.price || "0"}` — цена или «0».
- **стр. 119–130** — кнопка в корзину:
  - **стр. 120** — `onClick={() => !isInCart && !outOfStock && addToCart(bag)}` — при нажатии вызвать `addToCart(bag)`, **только если** сумки ещё нет в корзине **и** она не распродана. `&&` проверяет слева направо и останавливается на первом `false` — тогда `addToCart` не вызывается;
  - **стр. 121** — `disabled={outOfStock}` — распроданную кнопку нельзя нажать вообще;
  - **стр. 122–127** — оформление тремя вариантами: распродано — серая; в корзине — белая; иначе — чёрная;
  - **стр. 129** — текст: «Out of Stock», «In Cart» или «Add to Cart».

### Разметка: уход за изделием (стр. 140–177)

- **стр. 140–172** — чёрный блок «Care Instructions»: три колонки с советами (хранение, чистка, обращение). Только текст.
- **стр. 177** — отдаём компонент наружу.

## 12.2 front/src/pages/bracelets/BraceletsPage.jsx — каталог браслетов

**Устроена точно так же, как `BeadedBagsPage` (12.1)** — каждую строку логики можно читать по разбору выше. Отличия:
- **стр. 7** — состояние называется `bracelets`;
- **стр. 13–27** — загрузка; на **стр. 17–19** фильтр оставляет `product.category === "bracelets"`;
- **стр. 34, 54** — другие тексты: «BRACELETS», «Our Collection»;
- **стр. 68** — `isInCart` — `items.some(...)`: есть ли браслет в корзине; **стр. 69** — `outOfStock` — остаток ровно 0;
- **стр. 74** — у картинки нет обработчика `onError`;
- **стр. 80–90** — плашка остатка (как в 12.1, стр. 81–91);
- **стр. 119–120** — кнопка: `addToCart(item)` только если не в корзине и не распродан; `disabled` у распроданного;
- **стр. 142** — свои советы по уходу «Care Instructions».
- **стр. 176** — экспорт.

## 12.3 front/src/pages/product/ProductDetailPage.jsx — карточка товара

**Что это за файл.** Страница одного товара `/products/:id`: большое фото, название, стиль, особенности, цена, остаток, кнопка в корзину.
**Кто подключает:** `App.jsx` (адрес `/products/:id`). Сюда ведут ссылки «View Details» из каталогов.
**Что подключает:** `useEffect`, `useState` (стр. 1); `useParams`, `useNavigate`, `Link` (стр. 2); `useCart` (стр. 3); иконка стрелки (стр. 4); `api`, `imageUrl` (стр. 5).

### Состояние и загрузка (стр. 7–29)

```jsx
1  import React, { useEffect, useState } from 'react';
2  import { useParams, useNavigate, Link } from "react-router-dom";
3  import { useCart } from "../../context/CartContext";
4  import { ArrowLeft } from "lucide-react";
5  import api, { imageUrl } from "../../api";
6
7  const ProductDetailPage = () => {
8    const { id } = useParams();
9    const navigate = useNavigate();
10   const { items, addToCart } = useCart();
11   const [product, setProduct] = useState(null);
12   const [loading, setLoading] = useState(true);
13   const [notFound, setNotFound] = useState(false);
14
15   // useParams gave us the id from the address, so we ask the server for that
16   // one product. The effect runs again if the id changes.
17   useEffect(() => {
18     api
19       .get(`/api/products/${id}`)
20       .then((response) => {
21         setProduct(response.data.data);
22         setLoading(false);
23       })
24       .catch((error) => {
25         console.log(error);
26         setNotFound(true);
27         setLoading(false);
28       });
29   }, [id]);
```

- **стр. 8** — `useParams()` — достаёт переменные части адреса. В `App.jsx` маршрут `/products/:id`, поэтому для адреса `/products/65f1bbb` получится `{ id: '65f1bbb' }`, и деструктуризация кладёт `'65f1bbb'` в `id`.
- **стр. 9** — `navigate` — функция перехода (для кнопки «назад»).
- **стр. 10** — из корзины: что уже лежит и функция добавления.
- **стр. 11** — `product` — товар. Сначала `null` — ещё не загружен.
- **стр. 12** — `loading` — идёт загрузка, сначала `true`.
- **стр. 13** — `notFound` — товар не найден, сначала `false`.
- **стр. 17** — эффект загрузки. `[id]` в конце (стр. 29) — выполнить после первой отрисовки и снова, если `id` в адресе поменяется (перешли с одного товара на другой).
- **стр. 18–19** — `GET /api/products/65f1bbb` — шаблонная строка подставляет `id`. На сервере — `getProductById`.
- **стр. 20–23** — ответ пришёл: кладём товар (`response.data.data`) и выключаем загрузку.
- **стр. 24–28** — ошибка (сервер ответил 404 — такого товара нет, или 500): в консоль, `notFound` — `true`, загрузка выключена.

### Ранние выходы и подготовка (стр. 31–56)

```jsx
31   if (loading) {
32     return (
33       <div className="bg-white min-h-screen flex items-center justify-center">
34         <p className="font-['Centaur'] text-[24px] text-black/60 tracking-[4px]">Loading...</p>
35       </div>
36     );
37   }
38
39   if (notFound || !product) {
40     return (
41       <div className="bg-white min-h-screen flex flex-col items-center justify-center gap-8">
42         <p className="font-['Dorsa'] text-[72px] tracking-[12px] text-black">Product Not Found</p>
43         <Link
44           to="/"
45           className="font-['Centaur'] text-[18px] tracking-[3px] text-black underline hover:opacity-60 transition-opacity"
46         >
47           Return to Home
48         </Link>
49       </div>
50     );
51   }
52
53   const isInCart = items.some((item) => item.id === product._id);
54   const outOfStock = product.stock === 0;
55   const backPath = product.category === "bracelets" ? "/bracelets" : "/beaded-bags";
56   const backLabel = product.category === "bracelets" ? "Bracelets" : "Beaded Bags";
```

- **стр. 31–37** — пока грузится — вернуть только надпись «Loading...». `return` внутри компонента заканчивает его: остальная разметка не рисуется.
- **стр. 39–51** — товар не найден **или** (`||`) его почему-то нет — экран «Product Not Found» и ссылка на главную.
- Дальше товар точно есть.
- **стр. 53** — `isInCart` — `items.some(...)`: есть ли в корзине позиция с id этого товара (`true`/`false`).
- **стр. 54** — `outOfStock` — распродан: остаток ровно 0 (`null` — не отслеживается — это не распродан).
- **стр. 55** — куда ведёт кнопка «назад»: браслет — в каталог браслетов, иначе — в каталог сумок (тернарный оператор).
- **стр. 56** — текст кнопки «назад» — так же.

### Разметка (стр. 58–168)

```jsx
58   return (
59     <div className="bg-white min-h-screen">
60       <div className="max-w-[1440px] mx-auto px-8 py-8">
61         <button
62           onClick={() => navigate(backPath)}
63           className="flex items-center gap-2 font-['Centaur'] text-[16px] tracking-[2.88px] text-black/60 hover:text-black transition-colors cursor-pointer bg-transparent border-none p-0 mb-12"
64         >
65           <ArrowLeft className="w-4 h-4" />
66           Back to {backLabel}
67         </button>
68       </div>
69
70       <div className="max-w-[1440px] mx-auto px-8 pb-24">
71         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
72           <div className="aspect-square bg-[#fafafa] overflow-hidden border border-black/10">
73             <img
74               src={imageUrl(product.file_name)}
75               alt={product.model_name}
76               className="w-full h-full object-cover"
77               onError={(e) => { e.target.style.display = "none"; }}
78             />
79           </div>
```

- **стр. 61–67** — кнопка «← Back to Bracelets» / «← Back to Beaded Bags». `onClick={() => navigate(backPath)}` — при нажатии перейти по адресу со стр. 55.
- **стр. 71** — сетка из двух колонок на больших экранах (фото и описание), на телефоне — одна под другой.
- **стр. 72–79** — фото: адрес через `imageUrl`. **стр. 77** — `onError` — картинка не загрузилась — спрятать её (`e.target` — сам тег `<img>`, `style.display = "none"` — не показывать), чтобы не было значка «сломанной картинки».

```jsx
81            <div className="flex flex-col justify-center">
82              <span className="font-['Centaur'] text-[14px] tracking-[3.6px] text-[#999] uppercase mb-4">
83                {product.category}
84              </span>
85
86              <h1 className="font-['Perpetua_Titling_MT'] text-[48px] md:text-[64px] tracking-[8px] leading-tight text-black mb-6">
87                {product.model_name}
88              </h1>
89
90              {product.style?.length > 0 && (
91                <div className="flex flex-wrap gap-2 mb-6">
92                  {product.style.map((s, i) => (
93                    <span
94                      key={i}
95                      className="font-['Centaur'] text-[13px] tracking-[2.34px] text-[#666] bg-[#f5f5f5] px-4 py-1.5 uppercase"
96                    >
97                      {s}
98                    </span>
99                  ))}
100               </div>
101             )}
102
103             {product.details?.length > 0 && (
104               <div className="mb-8">
105                 {product.details.map((detail, i) => (
106                   <p
107                     key={i}
108                     className="font-['Centaur'] text-[18px] tracking-[3.24px] text-[#555] leading-relaxed mb-2"
109                   >
110                     {detail}
111                   </p>
112                 ))}
113               </div>
114             )}
115
116             <div className="flex items-center justify-between mb-10 border-t border-b border-black/10 py-6">
117               <span className="font-['Centaur'] text-[16px] tracking-[2.88px] text-[#888]">Price</span>
118               <span className="font-['Perpetua_Titling_MT'] text-[48px] tracking-[8px] text-black">
119                 ${product.price || "0"}
120               </span>
121             </div>
```

- **стр. 83** — категория (`bags` / `bracelets`) мелкими заглавными буквами (`uppercase`).
- **стр. 87** — название.
- **стр. 90** — `product.style?.length > 0 && (...)` — блок стилей рисуется, только если массив стилей есть и не пустой. `?.` — если `style` нет, `undefined > 0` даст `false`, и ничего не нарисуется.
- **стр. 92** — `style.map((s, i) => ...)` — по метке на каждый стиль. `i` — номер элемента (0, 1, 2…), используется как `key` (стр. 94).
- **стр. 103–114** — так же список особенностей `details`, каждая — отдельным абзацем.
- **стр. 116–121** — строка «Price» и цена (`$` — символ доллара, `product.price || "0"`).

```jsx
123             {typeof product.stock === "number" && (
124               <div className="mb-4 flex items-center gap-2">
125                 <span
126                   className={`inline-block w-2 h-2 rounded-full ${
127                     outOfStock ? "bg-red-600" : product.stock <= 3 ? "bg-amber-500" : "bg-green-600"
128                   }`}
129                 />
130                 <span
131                   className={`font-['Centaur'] text-[15px] tracking-[2px] ${
132                     outOfStock ? "text-red-600" : product.stock <= 3 ? "text-amber-600" : "text-black/70"
133                   }`}
134                 >
135                   {outOfStock
136                     ? "Currently out of stock"
137                     : product.stock <= 3
138                       ? `Hurry — only ${product.stock} left in stock`
139                       : `${product.stock} in stock`}
140                 </span>
141               </div>
142             )}
143
144             <button
145               onClick={() => !isInCart && !outOfStock && addToCart(product)}
146               disabled={outOfStock}
147               className={`w-full font-['Perpetua_Titling_MT'] text-[16px] tracking-[2.88px] py-5 rounded-full transition-colors border ${
148                 outOfStock
149                   ? "bg-white text-black/40 border-black/15 cursor-not-allowed"
150                   : isInCart
151                     ? "bg-white text-black border-black/30 cursor-default"
152                     : "bg-[#050000] text-white border-transparent hover:bg-[#050000]/80 cursor-pointer"
153               }`}
154             >
155               {outOfStock ? "Out of Stock" : isInCart ? "Added to Cart" : "Add to Cart"}
156             </button>
157
158             <p className="font-['Centaur'] text-[14px] tracking-[2.52px] text-[#999] text-center mt-4">
159               Handmade with care · Ships within 7–14 days
160             </p>
161           </div>
162         </div>
163       </div>
164     </div>
165   );
166 };
167
168 export default ProductDetailPage;
```

- **стр. 123** — блок остатка — только если остаток отслеживается (число, а не `null`).
- **стр. 125–129** — цветная точка: распродан — красная, 3 или меньше — оранжевая, иначе зелёная (вложенный тернарный оператор: «если… иначе если… иначе»).
- **стр. 130–140** — текст того же цвета: «Currently out of stock», «Hurry — only 2 left in stock» или «5 in stock».
- **стр. 144–156** — кнопка в корзину:
  - **стр. 145** — `!isInCart && !outOfStock && addToCart(product)` — добавить, только если товара ещё нет в корзине **и** он не распродан. `&&` останавливается на первом `false`, и `addToCart` тогда не вызывается;
  - **стр. 146** — распроданную кнопку нельзя нажать;
  - **стр. 147–153** — три вида оформления;
  - **стр. 155** — текст: «Out of Stock», «Added to Cart» или «Add to Cart».
- **стр. 158–160** — приписка о ручной работе и сроке отправки.
- **стр. 168** — экспорт.

# Часть 13. Сайт: конструктор сумки

## 13.1 front/src/pages/custom-studio/CustomStudioPage.jsx

**Что это за файл.** Конструктор сумки `/custom-studio`: три шага — размер, ремешок, цвет бусин. Справа — фото и цена, в конце — кнопка «Add to Cart».
**Кто подключает:** `App.jsx` (адрес `/custom-studio`). Сюда ведут кнопки CUSTOM и CREATE на главной.

**С сервером не общается.** Сумка попадает в корзину через `addCustomItem` (`CartContext.jsx`), а цену при оплате сервер считает сам (`OrderController.js`, стр. 15–16 и 90–127). Цена на этой странице — только для показа.

### Данные конструктора (стр. 1–169)

```jsx
1 import React, { useState, useEffect } from 'react';
2 import { motion, AnimatePresence } from "framer-motion";
3 import { useCart } from "../../context/CartContext";
4 import { useNavigate } from "react-router-dom";
5
```

- **стр. 1** — `useState` и `useEffect`.
- **стр. 2** — `motion` и `AnimatePresence` из `framer-motion` — анимации (`motion.div` — `div` с анимацией; `AnimatePresence` даёт элементу анимированно исчезнуть).
- **стр. 3** — `useCart` — нужна функция `addCustomItem`.
- **стр. 4** — `useNavigate` — перейти в корзину после добавления.

```jsx
7  // Real product photos, one per size (filenames match the cm dimensions below).
8  import sizeMini from "./10x8.png";
9  import sizeSmall from "./14x11.png";
10 import sizeMedium from "./20x16.png";
11 import sizeLarge from "./28x22.png";
12
13 // Photos of the bag with every strap, for each size.
14 // Mini (10×8) photos:
15 import strapMiniGolden from "./10x8 handl/10x8 gold.png";
16 import strapMiniSilver from "./10x8 handl/10x8 silver.png";
17 import strapMiniMixedGold from "./10x8 handl/10x8 mixed stripe.png";
18 import strapMiniMixedSilver from "./10x8 handl/10x8 mixed stripe silver.png";
19 import strapMiniBeaded from "./10x8 handl/10x8 beaded stripe.png";
20 // Small (14×11) photos:
21 import strapSmallGolden from "./14x11 strap/14x11 gold.png";
22 import strapSmallSilver from "./14x11 strap/14x11 silver.png";
23 import strapSmallMixedGold from "./14x11 strap/14x11 golden and beaded.png";
24 import strapSmallMixedSilver from "./14x11 strap/14x11 silver and beaded.png";
25 import strapSmallBeaded from "./14x11 strap/14x11 beaded.png";
26
27 const SIZES = [
28   { id: "mini", label: "Mini", cm: "10×8 cm", price: 120, image: sizeMini },
29   { id: "small", label: "Small", cm: "14×11 cm", price: 180, image: sizeSmall },
30   { id: "medium", label: "Medium", cm: "20×16 cm", price: 260, image: sizeMedium },
31   { id: "large", label: "Large", cm: "28×22 cm", price: 360, image: sizeLarge },
32 ];
33
34 const STRAPS = [
35   { id: "golden", label: "Golden", price: 30, images: { mini: strapMiniGolden, small: strapSmallGolden } },
36   { id: "silver", label: "Silver", price: 30, images: { mini: strapMiniSilver, small: strapSmallSilver } },
37   {
38     id: "mixed",
39     label: "Mixed",
40     price: 40,
41     // Mixed comes with a gold or a silver chain, so it has two sets of photos.
42     chainImages: {
43       gold: { mini: strapMiniMixedGold, small: strapSmallMixedGold },
44       silver: { mini: strapMiniMixedSilver, small: strapSmallMixedSilver },
45     },
46   },
47   { id: "beaded", label: "Beaded", price: 45, images: { mini: strapMiniBeaded, small: strapSmallBeaded } },
48 ];
```

- **стр. 8–25** — импорт фотографий. Vite превращает `import картинка from "./файл.png"` в **адрес** этой картинки — строку, которую можно поставить в `<img src={...}>`.
  - **стр. 8–11** — фото сумки каждого размера;
  - **стр. 15–25** — фото сумки с каждым ремешком — для размеров Mini и Small.
- **стр. 27–32** — `SIZES` — четыре размера. У каждого: `id` (код), `label` (название), `cm` (размер в сантиметрах), `price` (цена в долларах), `image` (фото).
- **стр. 34–48** — `STRAPS` — четыре ремешка: `id`, `label`, `price` (доплата) и фото.
  - У обычных ремешков фото в `images: { mini: ..., small: ... }`.
  - **стр. 37–46** — у Mixed цепочка бывает золотая или серебряная, поэтому вместо `images` — `chainImages` с двумя наборами: `gold` и `silver`.
  - Цены здесь те же, что в таблицах на сервере (`OrderController.js` стр. 15–16).

```jsx
50 // Strap photos only exist for mini/small; other sizes fall back to the mini photo.
51 // Mixed strap has a chain color (gold/silver); we pick its photo from chainImages.
52 const strapImageFor = (strap, sizeId, chainColor = "gold") => {
53   // Step 1: find the set of photos for this strap ({ mini: ..., small: ... }).
54   let set;
55   if (strap.chainImages) {
56     // Mixed strap: the set depends on the chain color. Unknown color -> gold.
57     set = strap.chainImages[chainColor];
58     if (!set) {
59       set = strap.chainImages.gold;
60     }
61   } else {
62     // Any other strap has one set.
63     set = strap.images;
64   }
65
66   // No set at all: return an empty picture instead of breaking the page.
67   if (!set) {
68     return "";
69   }
70
71   // Step 2: the photo for this size. Medium and large have none, so mini is used.
72   if (set[sizeId]) {
73     return set[sizeId];
74   }
75   return set.mini;
76 };
77
78 // Display label for a strap; Mixed appends its chain color (e.g. "Mixed (Gold)").
79 const strapLabelFor = (strap, chainColor) => {
80   if (strap.id !== "mixed") {
81     return strap.label;
82   }
83
84   let colorName = "Silver";
85   if (chainColor === "gold") {
86     colorName = "Gold";
87   }
88   return `${strap.label} (${colorName})`;
89 };
```

**Функция `strapImageFor(strap, sizeId, chainColor)`** — какое фото показать для ремешка. Вызывается на стр. 193, 216, 318.
- **стр. 52** — параметры: ремешок (объект из `STRAPS`), код размера, цвет цепочки. `chainColor = "gold"` — значение по умолчанию, если третий аргумент не передали.
- **стр. 54** — шаг 1: найти набор фото ремешка — объект вида `{ mini: ..., small: ... }`. `let set;` — переменная пока без значения.
- **стр. 55–60** — у Mixed есть `chainImages`: набор берём по цвету цепочки (`strap.chainImages['silver']`), а если такого цвета нет — золотой.
- **стр. 61–64** — у остальных ремешков один набор — `images`.
- **стр. 67–69** — набора нет вообще — пустая строка вместо картинки, чтобы страница не сломалась.
- **стр. 72–74** — шаг 2: есть фото для выбранного размера (`set['small']`) — возвращаем его.
- **стр. 75** — для Medium и Large фото нет — берём mini.

**Функция `strapLabelFor(strap, chainColor)`** — название ремешка для показа. Вызывается на стр. 189 и 319.
- **стр. 80–82** — не Mixed — просто название («Golden»).
- **стр. 84–87** — Mixed: цвет по умолчанию «Silver», а если цепочка золотая — «Gold».
- **стр. 88** — «Mixed (Gold)» или «Mixed (Silver)».

```jsx
109 const COLORS = [
110   { id: "aquamarine", name: "Aquamarine", hex: "#68c4e8", beads: beadsAquamarine },
111   { id: "light-blue", name: "Light Blue", hex: "#92bbef", beads: beadsLightBlue },
112   { id: "dark-blue", name: "Dark Blue", hex: "#324b8b", beads: beadsDarkBlue },
113   { id: "blue-purple", name: "Blue Purple", hex: "#ab9de2", beads: beadsBluePurple },
114   { id: "grass-green", name: "Grass Green", hex: "#7ad19b", beads: beadsGrassGreen },
115   { id: "light-pink", name: "Light Pink", hex: "#d774b2", beads: beadsLightPink },
116   { id: "dark-pink", name: "Dark Pink", hex: "#f49ca9", beads: beadsDarkPink },
117   { id: "peach-pink", name: "Peach Pink", hex: "#f67aa8", beads: beadsPeachPink },
118   { id: "big-red", name: "Big Red", hex: "#c74f53", beads: beadsBigRed },
119   { id: "light-yellow", name: "Light Yellow", hex: "#f2d07d", beads: beadsLightYellow },
120   { id: "pure-white", name: "Pure White", hex: "#dcdcdd", beads: beadsPureWhite },
121   { id: "creamy-white", name: "Creamy White", hex: "#d8d5cb", beads: beadsCreamyWhite },
122   { id: "transparent-white", name: "Transparent White", hex: "#e5dddc", beads: beadsTransparentWhite },
123   { id: "light-powder", name: "Light Powder", hex: "#f4bdd0", beads: beadsLightPowder },
124   { id: "black", name: "Black", hex: "#494c4a", beads: beadsBlack },
125 ];
```

- **стр. 93–107** (импорты над этим кодом) — фото настоящих бусин каждого цвета.
- **стр. 109–125** — `COLORS` — 15 цветов бусин: `id` (код), `name` (название), `hex` (цвет-запаска, если фото не загрузится) и `beads` (фото бусин).

```jsx
127 const BagPreview = ({ image, alt }) => {
128   return (
129     <div className="relative w-full h-full">
130       <img
131         src={image}
132         alt={alt}
133         className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
134       />
135     </div>
136   );
137 };
138
139 const StepHeader = ({ step, total, title }) => {
140   return (
141     <div className="mb-6">
142       <p className="font-['Centaur'] text-[13px] tracking-[3px] text-[#999] uppercase mb-1">
143         Step {step} of {total}
144       </p>
145       <h3 className="font-['Dorsa'] text-[36px] tracking-[4px] text-black leading-none">
146         {title}
147       </h3>
148     </div>
149   );
150 };
151
152 const STEPS = ["Size", "Strap", "Color"];
153 // Names for the steps, so the code says STEP.SIZE instead of 0.
154 const STEP = { SIZE: 0, STRAP: 1, COLOR: 2 };
155
156 const CHAIN_FINISHES = [
157   { id: "gold", label: "Gold" },
158   { id: "silver", label: "Silver" },
159 ];
160
161 // How long the "Added ✓" state shows before redirecting to the cart.
162 const REDIRECT_DELAY_MS = 1200;
163
164 // Shared look for selectable option buttons (size / strap / chain finish).
165 const optionClass = (selected) => {
166   return selected
167     ? "border-black bg-black text-white"
168     : "border-black/20 bg-white text-black hover:border-black/50";
169 };
```

- **Компонент `BagPreview`** (стр. 127–137) — большое фото сумки с тенью. Получает `image` (адрес) и `alt` (подпись). Используется на стр. 472.
- **Компонент `StepHeader`** (стр. 139–150) — заголовок шага: «Step 2 of 3» и название («Choose Strap»). Используется на стр. 290, 314, 378.
- **стр. 152** — названия шагов для вкладок.
- **стр. 154** — `STEP` — имена номеров шагов, чтобы в коде было понятно: `STEP.SIZE` вместо `0`, `STEP.STRAP` вместо `1`, `STEP.COLOR` вместо `2`.
- **стр. 156–159** — варианты цепочки для ремешка Mixed.
- **стр. 162** — через сколько миллисекунд после добавления перейти в корзину: 1200 мс = 1,2 секунды.
- **стр. 165–169** — `optionClass(selected)` — классы оформления кнопки-варианта: выбранная — чёрная с белым текстом, остальные — белые с серой рамкой. Возвращает строку классов.

### Компонент `CustomStudioPage` (стр. 171–550)

#### Состояние и вычисления (стр. 171–195)

```jsx
171 const CustomStudioPage = () => {
172   const [step, setStep] = useState(0);
173   const [config, setConfig] = useState({
174     size: "small", // Small is chosen first because it is the most popular size
175     strap: "golden",
176     chainColor: "gold",
177     color: COLORS[0],
178   });
179   const [addedToCart, setAddedToCart] = useState(false);
180   const [lightbox, setLightbox] = useState(null);
181   const { addCustomItem } = useCart();
182   const navigate = useNavigate();
183
184   const sizeInfo = SIZES.find((s) => s.id === config.size);
185   const strapInfo = STRAPS.find((s) => s.id === config.strap);
186   const totalPrice = sizeInfo.price + strapInfo.price;
187
188   // "Mixed" shows its chain color in the display label; other straps just use their label.
189   const strapLabel = strapLabelFor(strapInfo, config.chainColor);
190
191   // Preview follows the active step: size photo on Size, strap photo otherwise.
192   const onSizeStep = step === STEP.SIZE;
193   const previewImage = onSizeStep ? sizeInfo.image : strapImageFor(strapInfo, config.size, config.chainColor);
194   const previewLabel = onSizeStep ? `${sizeInfo.label} · ${sizeInfo.cm}` : `${sizeInfo.label} · ${strapLabel}`;
195   const openPreviewLightbox = () => setLightbox({ image: previewImage, label: previewLabel });
```

- **стр. 172** — `step` — текущий шаг: 0 — размер, 1 — ремешок, 2 — цвет.
- **стр. 173–178** — `config` — выбор покупателя одним объектом. Начальные значения: размер Small (самый популярный), ремешок Golden, золотая цепочка, первый цвет из списка (`COLORS[0]` — Aquamarine; цвет хранится целым объектом, а не кодом).
- **стр. 179** — `addedToCart` — сумку только что добавили (кнопка показывает «Added ✓», запускается переход в корзину).
- **стр. 180** — `lightbox` — какое фото открыто крупно поверх страницы: `null` — ничего, иначе `{ image, label }`.
- **стр. 181** — из корзины берём функцию `addCustomItem`.
- **стр. 182** — функция перехода.
- **стр. 184** — `sizeInfo` — полный объект выбранного размера. `SIZES.find(...)` возвращает первый элемент, у которого `s.id === config.size`: для `'small'` — `{ id: 'small', label: 'Small', cm: '14×11 cm', price: 180, image: ... }`.
- **стр. 185** — `strapInfo` — так же для ремешка.
- **стр. 186** — цена = цена размера + цена ремешка: 180 + 30 = 210.
- **стр. 189** — название ремешка для показа («Golden» или «Mixed (Gold)»).
- **стр. 192** — `onSizeStep` — сейчас первый шаг (`true`/`false`).
- **стр. 193** — какое фото показывать справа: на шаге размера — фото размера, на остальных — фото с ремешком.
- **стр. 194** — подпись к фото: «Small · 14×11 cm» или «Small · Golden».
- **стр. 195** — `openPreviewLightbox` — открыть большое фото справа крупно: кладём в `lightbox` адрес и подпись.

#### Функции (стр. 198–231)

```jsx
197   // Any change makes a new bag, so the Add to Cart button works again.
198   function updateConfig(patch) {
199     setConfig((c) => ({ ...c, ...patch }));
200     setAddedToCart(false);
201   }
202
203   // Drive the post-add redirect from an effect so the timer is cleared if the user leaves first.
204   useEffect(() => {
205     if (!addedToCart) return;
206     const timer = setTimeout(() => navigate("/cart"), REDIRECT_DELAY_MS);
207     return () => clearTimeout(timer);
208   }, [addedToCart, navigate]);
209
210   function handleAddToCart() {
211     const name = `Custom Beaded Bag — ${config.color.name} / ${strapLabel}`;
212     addCustomItem({
213       id: `custom-${Date.now()}`,
214       name,
215       price: totalPrice,
216       image: strapImageFor(strapInfo, config.size, config.chainColor), // real thumbnail, not ""
217       category: "custom",
218       quantity: 1,
219       config: {
220         // What the customer chose. The server counts the price from it.
221         size: config.size,
222         strap: config.strap,
223         chainColor: strapInfo.id === "mixed" ? config.chainColor : null,
224         color: config.color.id,
225       },
226     });
227     setAddedToCart(true);
228   }
229
230   const canGoNext = step < STEPS.length - 1;
231   const canGoPrev = step > 0;
```

- **стр. 198** — **функция `updateConfig(patch)`** — поменять часть выбора. `patch` — объект с тем, что меняется: `{ size: 'large' }` или `{ strap: 'mixed' }`.
- **стр. 199** — `setConfig((c) => ({ ...c, ...patch }))` — в `setConfig` передаём функцию: она получает старый выбор `c` и возвращает новый объект — все старые поля (`...c`) плюс поверх них новые (`...patch`). Пример: `{ size: 'small', strap: 'golden', ... }` + `{ size: 'large' }` → `{ size: 'large', strap: 'golden', ... }`.
- **стр. 200** — после любого изменения это уже другая сумка — кнопку «Add to Cart» снова можно нажать.
- **стр. 204–208** — эффект перехода в корзину. Срабатывает, когда меняется `addedToCart` (или `navigate`).
  - **стр. 205** — сумку не добавляли — ничего не делать.
  - **стр. 206** — `setTimeout(функция, 1200)` — вызвать функцию через 1,2 секунды: перейти на `/cart`. Возвращает номер таймера.
  - **стр. 207** — функция очистки: если покупатель ушёл со страницы раньше, `clearTimeout(timer)` отменяет таймер — иначе через секунду его бы «выдернуло» в корзину с другой страницы.
- **стр. 210** — **функция `handleAddToCart()`** — положить сумку в корзину. Вызывается кнопкой на последнем шаге (стр. 442).
  - **стр. 211** — название: «Custom Beaded Bag — Aquamarine / Golden».
  - **стр. 212–226** — `addCustomItem({...})` — передаём готовую позицию корзины:
    - **стр. 213** — `id` — `custom-` + текущее время в миллисекундах (`custom-1718000000000`) — уникальный. По приставке `custom-` корзина отличает такие сумки (`isCustom` в `CartContext.jsx`);
    - **стр. 214–218** — название, цена (только для показа), фото, категория `custom`, количество 1;
    - **стр. 219–225** — `config` — что выбрал покупатель. **По этим данным сервер сам посчитает цену.** `chainColor` — только для Mixed, у остальных `null`; `color` — код цвета (`'aquamarine'`), а не весь объект.
  - **стр. 227** — `addedToCart` — `true`: кнопка меняется и запускается эффект со стр. 204.
- **стр. 230** — `canGoNext` — есть ли следующий шаг: текущий меньше последнего (`STEPS.length - 1` = 2).
- **стр. 231** — `canGoPrev` — есть ли предыдущий: шаг больше 0.

#### Разметка (стр. 233–552)

```jsx
253       <div className="border-b border-black/10">
254         <div className="max-w-[1200px] mx-auto px-8 flex items-center">
255           {STEPS.map((s, i) => (
256             <button
257               key={s}
258               onClick={() => setStep(i)}
259               className="flex-1 py-4 text-center relative cursor-pointer bg-transparent border-none"
260             >
261               <span
262                 className={`font-['Perpetua_Titling_MT'] text-[11px] tracking-[2.5px] uppercase transition-colors ${i === step ? "text-black" : i < step ? "text-black/60" : "text-black/25"
263                   }`}
264               >
265                 {s}
266               </span>
267               {i === step && (
268                 <motion.div layoutId="stepIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
269               )}
270               {i < step && (
271                 <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/20" />
272               )}
273             </button>
274           ))}
275         </div>
276       </div>
```

- **стр. 235–251** — чёрный блок с заголовком «Custom Studio» и подзаголовком, появляются с анимацией (`initial` — начало: прозрачный и ниже; `animate` — конец).
- **стр. 255** — вкладки шагов: `STEPS.map((s, i) => ...)` — по кнопке на шаг; `s` — название, `i` — номер.
- **стр. 258** — нажатие на вкладку — перейти на этот шаг.
- **стр. 262** — цвет текста: текущий шаг — чёрный, пройденные (`i < step`) — серый, будущие — светлый.
- **стр. 267–269** — под текущим шагом — чёрная полоска. `layoutId="stepIndicator"` — `framer-motion` плавно переносит полоску между вкладками.
- **стр. 270–272** — под пройденными — светлая полоска.

```jsx
278       <div className="max-w-[1200px] mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
279         <div>
280           <AnimatePresence mode="wait">
281             <motion.div
282               key={step}
283               initial={{ opacity: 0, x: -20 }}
284               animate={{ opacity: 1, x: 0 }}
285               exit={{ opacity: 0, x: 20 }}
286               transition={{ duration: 0.25 }}
287             >
288               {step === STEP.SIZE && (
289                 <div>
290                   <StepHeader step={step + 1} total={STEPS.length} title="Choose Size" />
291                   <div className="grid grid-cols-2 gap-4">
292                     {SIZES.map((sz) => (
293                       <button
294                         key={sz.id}
295                         onClick={() => updateConfig({ size: sz.id })}
296                         aria-pressed={config.size === sz.id}
297                         className={`px-5 py-5 border text-left transition-all cursor-pointer ${optionClass(config.size === sz.id)}`}
298                       >
299                         <p className="font-['Perpetua_Titling_MT'] text-[13px] tracking-[2px] uppercase">{sz.label}</p>
300                         <p className={`font-['Centaur'] text-[12px] tracking-[1px] mt-1 ${config.size === sz.id ? "text-white/70" : "text-black/50"}`}>
301                           {sz.cm}
302                         </p>
303                         <p className={`font-['Dorsa'] text-[28px] tracking-[2px] mt-2 ${config.size === sz.id ? "text-white" : "text-black"}`}>
304                           ${sz.price}
305                         </p>
306                       </button>
307                     ))}
308                   </div>
309                 </div>
310               )}
```

- **стр. 278** — две колонки: слева выбор, справа фото.
- **стр. 280–287** — `AnimatePresence mode="wait"` и `key={step}`: при смене шага React считает блок новым — старый уезжает вправо и исчезает (`exit`), новый выезжает слева.
- **стр. 288** — `{step === STEP.SIZE && (...)}` — этот блок только на шаге размера.
- **стр. 292** — по кнопке на каждый размер.
- **стр. 295** — нажатие — `updateConfig({ size: sz.id })`.
- **стр. 296** — `aria-pressed` — для экранных дикторов: «нажата ли» (выбрана ли).
- **стр. 297** — оформление: `optionClass(config.size === sz.id)` — выбранная или нет.
- **стр. 299–305** — название, сантиметры, цена.

```jsx
312               {step === STEP.STRAP && (
313                 <div>
314                   <StepHeader step={step + 1} total={STEPS.length} title="Choose Strap" />
315                   <div className="grid grid-cols-2 gap-4">
316                     {STRAPS.map((st) => {
317                       const isSelected = config.strap === st.id;
318                       const strapImage = strapImageFor(st, config.size, config.chainColor);
319                       const strapCaption = `${sizeInfo.label} · ${strapLabelFor(st, config.chainColor)}`;
320                       return (
321                         // The choose button and the zoom button sit side by side,
322                         // because a button may not be put inside another button.
323                         <div key={st.id} className="group relative">
324                           <button
325                             onClick={() => updateConfig({ strap: st.id })}
326                             aria-pressed={isSelected}
327                             className={`w-full p-4 border text-left transition-all cursor-pointer ${optionClass(isSelected)}`}
328                           >
329                             <div className="relative aspect-square mb-3 overflow-hidden bg-[#FAFAFA]">
330                               <img
331                                 src={strapImage}
332                                 alt={`${st.label} strap`}
333                                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
334                               />
335                             </div>
336                             <p className="font-['Perpetua_Titling_MT'] text-[13px] tracking-[2px] uppercase">{st.label}</p>
337                             <p className={`font-['Dorsa'] text-[28px] tracking-[2px] mt-1 ${isSelected ? "text-white" : "text-black"}`}>
338                               +${st.price}
339                             </p>
340                           </button>
341                           <button
342                             type="button"
343                             onClick={() => setLightbox({ image: strapImage, label: strapCaption })}
344                             aria-label={`View ${st.label} strap photo`}
345                             className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-black text-[15px] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-white cursor-zoom-in border-none"
346                           >
347                             <span aria-hidden="true">⛶</span>
348                           </button>
349                         </div>
350                       );
351                     })}
352                   </div>
353
354                   {config.strap === "mixed" && (
355                     <div className="mt-6">
356                       <p className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] uppercase text-black/50 mb-3">
357                         Chain finish
358                       </p>
359                       <div className="flex gap-3">
360                         {CHAIN_FINISHES.map((chain) => (
361                           <button
362                             key={chain.id}
363                             onClick={() => updateConfig({ chainColor: chain.id })}
364                             aria-pressed={config.chainColor === chain.id}
365                             className={`flex-1 py-3 border font-['Perpetua_Titling_MT'] text-[12px] tracking-[2px] uppercase transition-all cursor-pointer ${optionClass(config.chainColor === chain.id)}`}
366                           >
367                             {chain.label}
368                           </button>
369                         ))}
370                       </div>
371                     </div>
372                   )}
373                 </div>
374               )}
```

- **стр. 312** — шаг ремешка.
- **стр. 316** — `STRAPS.map((st) => {...})` — по карточке на ремешок; фигурные скобки — сначала считаем переменные:
  - **стр. 317** — выбран ли этот ремешок;
  - **стр. 318** — его фото для текущего размера и цвета цепочки;
  - **стр. 319** — подпись для крупного фото.
- **стр. 323** — обёртка; кнопка выбора и кнопка увеличения стоят рядом, а не одна в другой — кнопку внутрь кнопки ставить нельзя (так написано в комментарии на стр. 321–322).
- **стр. 325** — нажатие на карточку — выбрать ремешок.
- **стр. 330–334** — фото ремешка.
- **стр. 336–339** — название и доплата «+$30».
- **стр. 341–348** — маленькая кнопка ⛶ в углу (видна при наведении): открыть фото крупно (`setLightbox` с адресом и подписью).
- **стр. 354** — выбран Mixed — показать выбор цепочки.
- **стр. 360–369** — две кнопки Gold / Silver: нажатие — `updateConfig({ chainColor: chain.id })`.

```jsx
376               {step === STEP.COLOR && (
377                 <div>
378                   <StepHeader step={step + 1} total={STEPS.length} title="Choose Color" />
379                   <div className="grid grid-cols-5 gap-3">
380                     {COLORS.map((c) => (
381                       <button
382                         key={c.id}
383                         title={c.name}
384                         aria-label={c.name}
385                         aria-pressed={config.color.id === c.id}
386                         onClick={() => updateConfig({ color: c })}
387                         className="relative aspect-square rounded-full overflow-hidden p-0 cursor-pointer transition-transform hover:scale-110"
388                         style={{
389                           backgroundColor: c.hex,
390                           border: config.color.id === c.id ? "3px solid #000" : "1px solid rgba(0,0,0,0.15)",
391                         }}
392                       >
393                         <img src={c.beads} alt="" loading="lazy" className="w-full h-full object-cover" />
394                         {config.color.id === c.id && (
395                           <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/35 text-white text-[16px] drop-shadow">✓</span>
396                         )}
397                       </button>
398                     ))}
399                   </div>
400                   <p className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50 mt-3">Selected: {config.color.name}</p>
401
402                   <div className="mt-10 border border-black/10 p-6 space-y-3">
403                     <p className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] uppercase text-black/50 mb-4">Order Summary</p>
404                     {[
405                       ["Size", `${sizeInfo.label} (${sizeInfo.cm})`],
406                       ["Strap", strapLabel],
407                       ["Color", config.color.name],
408                     ].map(([k, v]) => (
409                       <div key={k} className="flex justify-between items-center">
410                         <span className="font-['Centaur'] text-[14px] tracking-[2px] text-black/50">{k}</span>
411                         <span className="font-['Centaur'] text-[14px] tracking-[2px] text-black">{v}</span>
412                       </div>
413                     ))}
414                     <div className="border-t border-black/10 pt-3 flex justify-between items-center">
415                       <span className="font-['Perpetua_Titling_MT'] text-[12px] tracking-[2px] uppercase">Total</span>
416                       <span className="font-['Dorsa'] text-[40px] tracking-[2px] leading-none">${totalPrice}</span>
417                     </div>
418                   </div>
419                 </div>
420               )}
```

- **стр. 376** — шаг цвета.
- **стр. 380** — по круглой кнопке на каждый из 15 цветов.
- **стр. 383–385** — `title` (подсказка при наведении), `aria-label`, `aria-pressed` — название цвета и выбран ли он.
- **стр. 386** — нажатие — `updateConfig({ color: c })` — кладём весь объект цвета.
- **стр. 388–391** — фон — цвет-запаска; рамка: выбранный — толстая чёрная, остальные — тонкая серая.
- **стр. 393** — фото бусин внутри кружка; `loading="lazy"` — браузер грузит картинку, только когда она близко к экрану.
- **стр. 394–396** — у выбранного — галочка ✓ поверх.
- **стр. 400** — «Selected: Aquamarine».
- **стр. 402–418** — итог заказа:
  - **стр. 404–408** — массив пар `[название, значение]`; `.map(([k, v]) => ...)` — деструктуризация пары прямо в параметре: `k` — «Size», `v` — «Small (14×11 cm)»;
  - **стр. 409–412** — строка: название слева, значение справа;
  - **стр. 414–417** — итоговая цена.

```jsx
424           <div className="flex gap-4 mt-8">
425             {canGoPrev && (
426               <button
427                 onClick={() => setStep((s) => s - 1)}
428                 className="flex-1 py-4 border border-black text-black font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase hover:bg-black/5 transition-colors cursor-pointer bg-transparent"
429               >
430                 ← Back
431               </button>
432             )}
433             {canGoNext ? (
434               <button
435                 onClick={() => setStep((s) => s + 1)}
436                 className="flex-1 py-4 bg-black text-white font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase hover:bg-black/80 transition-colors cursor-pointer border-none"
437               >
438                 Next →
439               </button>
440             ) : (
441               <motion.button
442                 onClick={handleAddToCart}
443                 whileTap={{ scale: 0.97 }}
444                 disabled={addedToCart}
445                 className="flex-1 py-4 bg-black text-white font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase hover:bg-black/80 transition-colors disabled:opacity-60 cursor-pointer border-none"
446               >
447                 {addedToCart ? "Added ✓  Redirecting…" : `Add to Cart — $${totalPrice}`}
448               </motion.button>
449             )}
450           </div>
```

- **стр. 425–432** — «← Back», если есть предыдущий шаг: `setStep((s) => s - 1)` — номер шага минус 1.
- **стр. 433** — есть следующий шаг — кнопка «Next →» (стр. 434–439), иначе (последний шаг) — кнопка в корзину (стр. 441–448).
- **стр. 435** — `setStep((s) => s + 1)`.
- **стр. 442** — нажатие — `handleAddToCart`.
- **стр. 443** — при нажатии кнопка чуть сжимается.
- **стр. 444** — после добавления кнопку нельзя нажать повторно.
- **стр. 447** — текст: «Added ✓ Redirecting…» или «Add to Cart — $210». В шаблонной строке `$$` — первый `$` просто символ, второй начинает `${totalPrice}`.

```jsx
453         <div className="lg:sticky lg:top-8">
454           <div className="group border border-black/10 p-2 bg-[#FAFAFA] aspect-square flex items-center justify-center overflow-hidden">
455             <motion.div
456               key={previewImage}
457               role="button"
458               tabIndex={0}
459               aria-label={`View ${previewLabel} photo`}
460               initial={{ opacity: 0, scale: 0.96 }}
461               animate={{ opacity: 1, scale: 1 }}
462               transition={{ duration: 0.3 }}
463               onClick={openPreviewLightbox}
464               onKeyDown={(e) => {
465                 if (e.key === "Enter" || e.key === " ") {
466                   e.preventDefault();
467                   openPreviewLightbox();
468                 }
469               }}
470               className="w-full h-full max-w-[380px] max-h-[380px] mx-auto cursor-zoom-in transition-transform duration-500 group-hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
471             >
472               <BagPreview image={previewImage} alt={`${sizeInfo.label} beaded bag · ${strapInfo.label} strap`} />
473             </motion.div>
474           </div>
475
476           {step === STEP.COLOR ? (
477             <div className="mt-4 flex items-center gap-3 px-2">
478               <img src={config.color.beads} alt="" title={config.color.name} className="w-6 h-6 rounded-full border border-black/20 object-cover" />
479               <span className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50">
480                 {config.color.name} · {strapLabel}
481               </span>
482             </div>
483           ) : (
484             <div className="mt-4 px-2">
485               <span className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50">
486                 {onSizeStep ? sizeInfo.label : strapLabel}
487               </span>
488             </div>
489           )}
```

- **стр. 453** — правая колонка; на компьютере «прилипает» при прокрутке (`lg:sticky lg:top-8`).
- **стр. 455–473** — большое фото:
  - **стр. 456** — `key={previewImage}` — сменилось фото — React считает блок новым и проигрывает анимацию появления;
  - **стр. 457–459** — `role="button"`, `tabIndex={0}`, `aria-label` — блок ведёт себя как кнопка: на него можно перейти клавишей Tab, диктор назовёт его;
  - **стр. 463** — клик — открыть фото крупно;
  - **стр. 464–469** — то же с клавиатуры: `e.key` — нажатая клавиша; Enter или пробел — открыть. `e.preventDefault()` — отменить действие клавиши по умолчанию (пробел прокручивал бы страницу);
  - **стр. 472** — само фото (`BagPreview`).
- **стр. 476–489** — подпись под фото: на шаге цвета — кружок с бусинами и «цвет · ремешок», на других — название размера (на первом шаге) или ремешка.

```jsx
491           <div className="mt-6 flex items-end justify-between px-2">
492             <div>
493               <p className="font-['Centaur'] text-[13px] tracking-[3px] text-black/40 uppercase">Estimated price</p>
494               <p className="font-['Dorsa'] text-[64px] tracking-[4px] leading-none text-black">${totalPrice}</p>
495             </div>
496             <div className="text-right">
497               <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40">{sizeInfo.label}</p>
498               <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40">{strapLabel}</p>
499               <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40 mt-1">Made to order · 2–3 weeks</p>
500             </div>
501           </div>
502         </div>
503       </div>
504
505       <div className="border-t border-black/10 py-12 px-8 text-center bg-black/[0.02]">
506         <p className="font-['Centaur'] text-[15px] tracking-[3px] text-black/50 max-w-[600px] mx-auto">
507           Every custom bag is handmade to order. After placing your order, our artisans will reach out within 48 hours to confirm the details and begin crafting your unique piece.
508         </p>
509       </div>
510
511       <AnimatePresence>
512         {lightbox && (
513           <motion.div
514             initial={{ opacity: 0 }}
515             animate={{ opacity: 1 }}
516             exit={{ opacity: 0 }}
517             onClick={() => setLightbox(null)}
518             className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 cursor-zoom-out"
519           >
520             <button
521               onClick={() => setLightbox(null)}
522               className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-[22px] hover:bg-white/20 transition-colors cursor-pointer border-none"
523               aria-label="Close"
524               title="Close"
525             >
526               <span aria-hidden="true">✕</span>
527             </button>
528             <motion.div
529               initial={{ scale: 0.9, opacity: 0 }}
530               animate={{ scale: 1, opacity: 1 }}
531               exit={{ scale: 0.9, opacity: 0 }}
532               transition={{ duration: 0.25 }}
533               onClick={(e) => e.stopPropagation()}
534               className="flex flex-col items-center gap-4"
535             >
536               <img
537                 src={lightbox.image}
538                 alt={lightbox.label}
539                 className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl"
540               />
541               <p className="font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase text-white/80">
542                 {lightbox.label}
543               </p>
544             </motion.div>
545           </motion.div>
546         )}
547       </AnimatePresence>
548     </div>
549   );
550 };
551
552 export default CustomStudioPage;
```

- **стр. 491–501** — «Estimated price» и цена крупно; справа — размер, ремешок и «Made to order · 2–3 weeks».
- **стр. 505–509** — текст внизу о ручной работе.
- **стр. 511–547** — окно с крупным фото:
  - **стр. 512** — рисуется, только если `lightbox` не `null`;
  - **стр. 513–518** — тёмный фон на весь экран (`fixed inset-0`), проявляется; **стр. 517** — клик по фону — закрыть (`setLightbox(null)`);
  - **стр. 520–527** — кнопка ✕ — закрыть;
  - **стр. 533** — `e.stopPropagation()` — клик по самому фото **не** передаётся фону. Без этого клик по фото «всплыл» бы до фона (стр. 517) и закрыл окно;
  - **стр. 536–543** — фото и подпись из `lightbox`.
- **стр. 552** — экспорт.

# Часть 14. Сайт: корзина, оформление, «Спасибо»

## 14.1 front/src/pages/cart/CartPage.jsx — корзина

**Что это за файл.** Страница `/cart`: список позиций с кнопками − / + / удалить, итог и кнопка Checkout. Сама ничего не хранит — всё берёт из `CartContext`.
**Кто подключает:** `App.jsx` (адрес `/cart`). Сюда ведут значок корзины в шапке и конструктор после добавления.
**Что подключает:** `Link`, `useNavigate` (стр. 2), `useCart` (стр. 3), иконки (стр. 4).

```jsx
1  import React from 'react';
2  import { Link, useNavigate } from "react-router-dom";
3  import { useCart } from "../../context/CartContext";
4  import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
5
6  const CartPage = () => {
7    const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
8    const navigate = useNavigate();
9
10   if (items.length === 0) {
11     return (
12       <div className="bg-white min-h-screen py-20 px-6 md:px-8">
13         <div className="max-w-[1200px] mx-auto text-center">
14           <ShoppingBag className="w-24 h-24 mx-auto mb-8 text-black/20" strokeWidth={1} />
15           <h1 className="font-['Dorsa:Regular',sans-serif] text-[52px] sm:text-[80px] md:text-[120px] tracking-[6px] md:tracking-[21.6px] leading-none text-black mb-8">
16             Your Cart is Empty
17           </h1>
18           <p className="font-['Centaur:Regular',sans-serif] text-[#666] text-[18px] md:text-[24px] tracking-[3px] md:tracking-[4.32px] mb-12">
19             Discover our handmade treasures and add some beauty to your collection
20           </p>
21           <Link
22             to="/"
23             className="inline-block bg-black text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[16px] tracking-[2.88px] px-12 py-4 rounded-full hover:bg-black/80 transition-colors no-underline"
24           >
25             Continue Shopping
26           </Link>
27         </div>
28       </div>
29     );
30   }
```

- **стр. 7** — из корзины берём: позиции, удалить, поменять количество, сумму, очистить.
- **стр. 8** — функция перехода (на оформление).
- **стр. 10** — `items.length === 0` — в корзине ничего нет…
- **стр. 11–29** — …тогда вернуть только экран «Your Cart is Empty» с иконкой и ссылкой «Continue Shopping» на главную. `return` заканчивает компонент — остальная разметка не рисуется.

```jsx
32   return (
33     <div className="bg-white min-h-screen py-16 px-6 md:px-8">
34       <div className="max-w-[1400px] mx-auto">
35         <h1 className="font-['Dorsa:Regular',sans-serif] text-[56px] sm:text-[80px] md:text-[120px] tracking-[6px] md:tracking-[21.6px] leading-none text-black mb-4 text-center">
36           Shopping Cart
37         </h1>
38         <p className="font-['Centaur:Regular',sans-serif] text-[#666] text-[18px] md:text-[20px] tracking-[3.6px] text-center mb-12">
39           {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
40         </p>
41
42         <div className="grid lg:grid-cols-3 gap-12">
43
44           <div className="lg:col-span-2 space-y-6">
45             {items.map((item) => (
46               <div
47                 key={item.id}
48                 className="border border-black/10 p-4 md:p-6 flex flex-col sm:flex-row gap-4 md:gap-6 hover:border-black/30 transition-colors"
49               >
50
51                 <div className="w-full h-48 sm:w-32 sm:h-32 bg-[#fafafa] flex-shrink-0 overflow-hidden">
52                   <img
53                     src={item.image}
54                     alt={item.name}
55                     className="w-full h-full object-cover"
56                     onError={(e) => {
57                       e.target.style.display = 'none';
58                     }}
59                   />
60                 </div>
```

- **стр. 39** — «2 items in your cart»: число позиций и слово в нужной форме — одна позиция `'item'`, иначе `'items'` (тернарный оператор).
- **стр. 42** — две колонки на компьютере: позиции (2/3 ширины) и итог (1/3).
- **стр. 45** — `items.map((item) => (...))` — карточка на каждую позицию. Круглые скобки после `=>` — сразу вернуть разметку.
- **стр. 47** — `key={item.id}` — уникальный ключ.
- **стр. 52–59** — фото: `item.image` — уже полный адрес (его собрали в `CartContext`). `onError` — не загрузилось — спрятать картинку.

```jsx
63                  <div className="flex-1 flex flex-col justify-between">
64                    <div>
65                      <p className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[12px] tracking-[2.16px] text-[#666] mb-2 uppercase">
66                        {item.category}
67                      </p>
68                      <h3 className="font-['Centaur:Regular',sans-serif] text-[24px] tracking-[4.32px] text-black mb-3 m-0">
69                        {item.name}
70                      </h3>
71                      <p className="font-['Dorsa:Regular',sans-serif] text-[32px] tracking-[5.76px] text-black m-0">
72                        ${item.price.toFixed(2)}
73                      </p>
74                    </div>
75
76
77                    <div className="flex items-center justify-between mt-4">
78                      <div className="flex items-center gap-3 border border-black/20 rounded-full">
79                        <button
80                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
81                          className="p-2 hover:bg-black/5 transition-colors rounded-l-full cursor-pointer bg-transparent border-none"
82                          aria-label="Decrease quantity"
83                        >
84                          <Minus className="w-4 h-4" />
85                        </button>
86                        <span className="font-['Centaur:Regular',sans-serif] text-[18px] tracking-[3.24px] w-12 text-center">
87                          {item.quantity}
88                        </span>
89                        <button
90                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
91                          className="p-2 hover:bg-black/5 transition-colors rounded-r-full cursor-pointer bg-transparent border-none"
92                          aria-label="Increase quantity"
93                        >
94                          <Plus className="w-4 h-4" />
95                        </button>
96                      </div>
97
98                      <button
99                        onClick={() => removeFromCart(item.id)}
100                       className="p-2 hover:bg-red-50 text-red-600 transition-colors rounded-full cursor-pointer bg-transparent border-none"
101                       aria-label="Remove item"
102                     >
103                       <Trash2 className="w-5 h-5" />
104                     </button>
105                   </div>
106                 </div>
107
108
109                 <div className="flex flex-col justify-between items-end">
110                   <p className="font-['Dorsa:Regular',sans-serif] text-[36px] tracking-[6.48px] text-black m-0">
111                     ${(item.price * item.quantity).toFixed(2)}
112                   </p>
113                 </div>
114               </div>
115             ))}
```

- **стр. 66** — категория.
- **стр. 69** — название.
- **стр. 72** — цена за штуку. `toFixed(2)` — ровно два знака после точки: `180` → `'180.00'`.
- **стр. 79–85** — кнопка −: `updateQuantity(item.id, item.quantity - 1)` — количество на 1 меньше. Если получится 0, `updateQuantity` в `CartContext` ничего не сделает (стр. 183 там).
- **стр. 87** — текущее количество.
- **стр. 89–95** — кнопка +: количество на 1 больше.
- **стр. 82, 92, 101** — `aria-label` — подписи для экранных дикторов (у кнопок только иконки).
- **стр. 98–104** — мусорка: `removeFromCart(item.id)` — убрать позицию.
- **стр. 111** — сумма по позиции: `(цена × количество).toFixed(2)`. Скобки нужны, чтобы сначала умножить, а потом отформатировать.

```jsx
117
118             <button
119               onClick={clearCart}
120               className="font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2.88px] text-red-600 hover:text-red-700 underline transition-colors cursor-pointer bg-transparent border-none p-0 mt-4"
121             >
122               Clear all items
123             </button>
124           </div>
125
126
127           <div className="lg:col-span-1">
128             <div className="border border-black/20 p-8 sticky top-8">
129               <h2 className="font-['Dorsa:Regular',sans-serif] text-[48px] tracking-[8.64px] leading-none text-black mb-8 text-center m-0">
130                 Order Summary
131               </h2>
132
133               <div className="space-y-4 mb-8">
134                 <div className="flex justify-between font-['Centaur:Regular',sans-serif] text-[18px] tracking-[3.24px]">
135                   <span className="text-[#666]">Subtotal</span>
136                   <span className="text-black">${getTotalPrice().toFixed(2)}</span>
137                 </div>
138                 <div className="flex justify-between font-['Centaur:Regular',sans-serif] text-[18px] tracking-[3.24px]">
139                   <span className="text-[#666]">Shipping</span>
140                   <span className="text-black">Free</span>
141                 </div>
142                 <div className="border-t border-black/10 pt-4 mt-4">
143                   <div className="flex justify-between font-['Dorsa:Regular',sans-serif] text-[36px] tracking-[6.48px]">
144                     <span className="text-black">Total</span>
145                     <span className="text-black">${getTotalPrice().toFixed(2)}</span>
146                   </div>
147                 </div>
148               </div>
149
150               <button
151                 onClick={() => navigate("/checkout")}
152                 className="w-full bg-black text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[16px] tracking-[2.88px] py-4 rounded-full hover:bg-black/80 transition-colors mb-4 cursor-pointer border-none"
153               >
154                 Checkout
155               </button>
156
157               <Link
158                 to="/"
159                 className="block text-center font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2.88px] text-black hover:opacity-70 transition-opacity no-underline"
160               >
161                 Continue Shopping
162               </Link>
```

- **стр. 118–123** — «Clear all items»: `onClick={clearCart}` — передаём саму функцию (без скобок), React вызовет её при нажатии.
- **стр. 127–128** — правая колонка с итогом; `sticky top-8` — «прилипает» при прокрутке.
- **стр. 136** — Subtotal: `getTotalPrice()` — сумма всей корзины, двумя знаками.
- **стр. 140** — доставка — Free (бесплатно).
- **стр. 145** — Total — та же сумма.
- **стр. 150–155** — Checkout: `navigate("/checkout")` — перейти на оформление.
- **стр. 157–162** — ссылка «Continue Shopping» на главную.
- **стр. 164–182** — значки принимаемых карт — только картинка из текста.
- **стр. 191** — экспорт.

## 14.2 front/src/pages/checkout/CheckoutPage.jsx — оформление заказа

**Что это за файл.** Страница `/checkout`: форма контактов и адреса, выбор доставки или самовывоза, список заказа. Кнопка «Proceed to Payment» отправляет заказ на сервер и переводит на страницу оплаты Stripe.
**Кто подключает:** `App.jsx` (адрес `/checkout`). Сюда ведёт кнопка Checkout в корзине.
**Что подключает:** `useState` (стр. 1), `Link` (стр. 2), `useCart` (стр. 3), `api` и `authHeader` (стр. 4).

### Состояние (стр. 6–20)

```jsx
1  import React, { useState } from 'react';
2  import { Link } from "react-router-dom";
3  import { useCart } from "../../context/CartContext";
4  import api, { authHeader } from "../../api";
5
6  const CheckoutPage = () => {
7    const { items, getTotalPrice } = useCart();
8    const [form, setForm] = useState({
9      name: "",
10     email: "",
11     phone: "",
12     address: "",
13     city: "",
14     country: "",
15     notes: "",
16   });
17   const [deliveryMethod, setDeliveryMethod] = useState("delivery");
18   const [errors, setErrors] = useState({});
19   const [loading, setLoading] = useState(false);
20   const [message, setMessage] = useState("");
```

- **стр. 7** — из корзины: позиции и сумма.
- **стр. 8–16** — `form` — все поля формы одним объектом, сначала пустые строки. Каждое поле ввода привязано к своему ключу (`name="city"` → `form.city`).
- **стр. 17** — `deliveryMethod` — `"delivery"` (доставка) или `"pickup"` (самовывоз). Сначала доставка.
- **стр. 18** — `errors` — ошибки полей: `{ email: "Valid email required" }`. Сначала пустой объект — ошибок нет.
- **стр. 19** — `loading` — запрос отправлен, ждём ответа (кнопка неактивна).
- **стр. 20** — `message` — общий текст ошибки от сервера.

### Функция `validate()` (стр. 22–32) — проверка формы

```jsx
22   const validate = () => {
23     const e = {};
24     if (!form.name.trim()) e.name = "Required";
25     if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
26     if (deliveryMethod === "delivery") {
27       if (!form.address.trim()) e.address = "Required";
28       if (!form.city.trim()) e.city = "Required";
29       if (!form.country.trim()) e.country = "Required";
30     }
31     return e;
32   };
```

- **Кто вызывает:** `handleSubmit` (стр. 52). **Возвращает:** объект ошибок; пустой — всё в порядке.
- **стр. 23** — пустой объект ошибок.
- **стр. 24** — имя пустое (`trim()` убирает пробелы; `!''` → `true`) — `e.name = "Required"`. Запись `if (...) действие;` в одну строку — без фигурных скобок.
- **стр. 25** — почта пустая **или** не похожа на почту. `/\S+@\S+\.\S+/` — регулярное выражение: `\S+` — один или больше «не пробелов», потом `@`, потом снова не пробелы, точка (`\.`) и не пробелы. `.test(строка)` — подходит ли (`true`/`false`). `anna@mail.com` подходит, `anna@mail` — нет.
- **стр. 26–30** — адрес, город и страна обязательны **только при доставке**. При самовывозе их не проверяем.
- **стр. 31** — возвращаем найденные ошибки.

### Функция `handleChange(e)` (стр. 34–47) — ввод в поле

```jsx
34   // One handler for every field. The input's name ("email", "city"...)
35   // says which field of the form to change.
36   const handleChange = (e) => {
37     const field = e.target.name;
38     const value = e.target.value;
39
40     // Copy the form and change only this field.
41     setForm({ ...form, [field]: value });
42
43     // The customer is fixing this field, so its red error goes away.
44     if (errors[field]) {
45       setErrors({ ...errors, [field]: undefined });
46     }
47   };
```

- **Кто вызывает:** каждое поле формы при каждом нажатии клавиши (`onChange={handleChange}`).
- **стр. 37** — `e` — событие; `e.target` — поле, в котором печатают; `.name` — его атрибут `name`, например `"city"`.
- **стр. 38** — `.value` — текст, который сейчас в поле.
- **стр. 41** — копия формы (`...form`), в которой заменено одно поле. `[field]` в квадратных скобках — имя ключа берётся из переменной: если `field = "city"`, это то же самое, что `city: value`.
- **стр. 44–46** — если у этого поля была ошибка — убрать её (человек начал исправлять). `{ ...errors, [field]: undefined }` — копия ошибок, где у этого поля пусто.

### Функция `handleSubmit(e)` (стр. 49–83) — отправка заказа

```jsx
49   const handleSubmit = (e) => {
50     e.preventDefault();
51     setMessage("");
52     const errs = validate();
53     if (Object.keys(errs).length > 0) {
54       setErrors(errs);
55       return;
56     }
57
58     setLoading(true);
59
60     // A guest may also order, so the token is sent only when there is one.
61     const token = localStorage.getItem("token");
62     const config = token ? authHeader(token) : {};
63
64     const body = {
65       items,
66       customer: { name: form.name, email: form.email, phone: form.phone },
67       shipping: { address: form.address, city: form.city, country: form.country },
68       deliveryMethod,
69       notes: form.notes,
70     };
71
72     api
73       .post("/api/orders/checkout-session", body, config)
74       .then((response) => {
75         // The server opened a payment session and sent back its address.
76         window.location.href = response.data.url;
77       })
78       .catch((error) => {
79         console.log(error);
80         setMessage(error.response?.data?.message || "Could not start checkout.");
81         setLoading(false);
82       });
83   };
```

- **Кто вызывает:** форма при нажатии «Proceed to Payment» (`<form onSubmit={handleSubmit}>`, стр. 117).
- **стр. 50** — `e.preventDefault()` — отменить стандартное поведение формы: браузер перезагрузил бы страницу и отправил форму сам. Мы отправляем её через `api`.
- **стр. 51** — стереть прошлое сообщение об ошибке.
- **стр. 52** — проверить форму.
- **стр. 53** — `Object.keys(errs)` — массив ключей объекта ошибок (`['email', 'city']`). Длина больше 0 — есть ошибки…
- **стр. 54–55** — …показать их под полями и выйти, ничего не отправляя.
- **стр. 58** — кнопка становится неактивной и меняет текст.
- **стр. 61** — токен из браузера (или `null`, если гость).
- **стр. 62** — настройки запроса: есть токен — с заголовком входа (сервер запишет заказ на этого пользователя), нет — пустые настройки. Гость тоже может заказать.
- **стр. 64–70** — тело запроса:
  - **стр. 65** — `items` — позиции корзины. Цены в них сервер **не использует** — пересчитает сам;
  - **стр. 66** — контакты из формы;
  - **стр. 67** — адрес из формы;
  - **стр. 68** — способ получения (короткая запись `deliveryMethod: deliveryMethod`);
  - **стр. 69** — комментарий.
- **стр. 72–73** — `POST /api/orders/checkout-session` → на сервере `createCheckoutSession`.
- **стр. 74–76** — сервер создал страницу оплаты и прислал её адрес. `window.location.href = адрес` — браузер **уходит** с нашего сайта на страницу Stripe (это не переход внутри React, а настоящая загрузка другой страницы).
- **стр. 78–82** — ошибка: в консоль; показать текст от сервера (например «Only 2 of "Pink Bag" left in stock»), а если его нет — «Could not start checkout.»; снова включить кнопку.

### Пустая корзина и стиль полей (стр. 85–104)

```jsx
85    if (items.length === 0) {
86      return (
87        <div className="bg-white min-h-screen flex flex-col items-center justify-center gap-8 px-8">
88          <p className="font-['Dorsa'] text-[48px] md:text-[72px] tracking-[6px] md:tracking-[12px] text-black text-center">
89            Your cart is empty
90          </p>
91          <Link
92            to="/"
93            className="font-['Centaur'] text-[18px] tracking-[3px] text-black underline hover:opacity-60 transition-opacity"
94          >
95            Continue Shopping
96          </Link>
97        </div>
98      );
99    }
100
101   const inputClass = (field) =>
102     `w-full bg-transparent border-b py-3 font-['Centaur'] text-[18px] tracking-[2px] text-black placeholder-black/30 outline-none transition-colors ${
103       errors[field] ? "border-red-400" : "border-black/20 focus:border-black"
104     }`;
```

- **стр. 85–99** — корзина пустая — оформлять нечего: экран «Your cart is empty» и ссылка на главную.
- **стр. 101–104** — `inputClass(field)` — классы оформления поля: общие плюс цвет нижней линии. Есть ошибка у этого поля (`errors[field]`) — красная, нет — серая (чёрная при фокусе).

### Разметка (стр. 106–271)

```jsx
115
116         <div className="grid lg:grid-cols-3 gap-16">
117           <form onSubmit={handleSubmit} noValidate className="lg:col-span-2 space-y-10">
118             <div>
119               <h2 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] text-black mb-6 uppercase">
120                 Contact
121               </h2>
122               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
123                 <div>
124                   <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className={inputClass("name")} />
125                   {errors.name && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.name}</p>}
126                 </div>
127                 <div>
128                   <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email Address" className={inputClass("email")} />
129                   {errors.email && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.email}</p>}
130                 </div>
131                 <div className="md:col-span-2">
132                   <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (optional)" className={inputClass("phone")} />
133                 </div>
134               </div>
135             </div>
```

- **стр. 117** — `<form onSubmit={handleSubmit} noValidate>` — при отправке вызвать `handleSubmit`. `noValidate` — отключить встроенные проверки браузера (у нас свои, в `validate`).
- **стр. 124** — поле имени. Пять атрибутов, одинаковых у всех полей:
  - `name="name"` — ключ в `form`, по нему работает `handleChange`;
  - `value={form.name}` — что показывать в поле — значение из состояния (поле «управляемое»: React всегда знает его содержимое);
  - `onChange={handleChange}` — при вводе обновить состояние;
  - `placeholder` — серая подсказка в пустом поле;
  - `className={inputClass("name")}` — оформление с учётом ошибки.
- **стр. 125** — `{errors.name && <p>...</p>}` — под полем красный текст ошибки, только если она есть.
- **стр. 128–129** — почта (`type="email"` — на телефоне откроется клавиатура с `@`).
- **стр. 132** — телефон, необязательный.

```jsx
137             <div>
138               <h2 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] text-black mb-6 uppercase">
139                 Delivery Method
140               </h2>
141               <div className="grid grid-cols-2 gap-4">
142                 {[
143                   { id: "delivery", label: "Delivery", desc: "Ship to my address" },
144                   { id: "pickup", label: "Self Pickup", desc: "Collect in person" },
145                 ].map((opt) => (
146                   <button
147                     type="button"
148                     key={opt.id}
149                     onClick={() => setDeliveryMethod(opt.id)}
150                     className={`p-5 border text-left transition-all cursor-pointer ${
151                       deliveryMethod === opt.id ? "border-black bg-black text-white" : "border-black/20 hover:border-black/50"
152                     }`}
153                   >
154                     <p className="font-['Perpetua_Titling_MT'] text-[13px] tracking-[2px] uppercase">{opt.label}</p>
155                     <p className={`font-['Centaur'] text-[13px] tracking-[1px] mt-1 ${deliveryMethod === opt.id ? "text-white/70" : "text-black/50"}`}>
156                       {opt.desc}
157                     </p>
158                   </button>
159                 ))}
160               </div>
161             </div>
162
163             {deliveryMethod === "delivery" && (
164               <div>
165                 <h2 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] text-black mb-6 uppercase">
166                   Shipping Address
167                 </h2>
168                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
169                   <div className="md:col-span-2">
170                     <input name="address" value={form.address} onChange={handleChange} placeholder="Street Address" className={inputClass("address")} />
171                     {errors.address && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.address}</p>}
172                   </div>
173                   <div>
174                     <input name="city" value={form.city} onChange={handleChange} placeholder="City" className={inputClass("city")} />
175                     {errors.city && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.city}</p>}
176                   </div>
177                   <div>
178                     <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className={inputClass("country")} />
179                     {errors.country && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.country}</p>}
180                   </div>
181                 </div>
182               </div>
```

- **стр. 142–145** — массив из двух вариантов получения, и сразу `.map(...)` — по кнопке на вариант.
- **стр. 149** — нажатие — `setDeliveryMethod(opt.id)`.
- **стр. 150–152** — выбранный вариант — чёрный, другой — белый.
- **стр. 163** — `{deliveryMethod === "delivery" && (...)}` — блок адреса показывается только при доставке.
- **стр. 170–179** — поля адреса, города и страны — так же, как поля выше, с ошибками под каждым.

```jsx
184
185             <div>
186               <h2 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] text-black mb-6 uppercase">
187                 Notes
188               </h2>
189               <textarea
190                 name="notes"
191                 value={form.notes}
192                 onChange={handleChange}
193                 placeholder="Any special requests or instructions..."
194                 rows={4}
195                 className="w-full bg-transparent border border-black/20 p-4 font-['Centaur'] text-[18px] tracking-[2px] text-black placeholder-black/30 outline-none focus:border-black transition-colors resize-none"
196               />
197             </div>
198
199             {message && (
200               <p className="text-red-500 font-['Centaur'] text-[15px] tracking-[1px]">{message}</p>
201             )}
202
203             <button
204               type="submit"
205               disabled={loading}
206               className="w-full bg-black text-white font-['Perpetua_Titling_MT'] text-[16px] tracking-[2.88px] py-5 rounded-full hover:bg-black/80 transition-colors cursor-pointer border-none disabled:opacity-60"
207             >
208               {loading ? "Redirecting to payment…" : "Proceed to Payment"}
209             </button>
210           </form>
```

- **стр. 189–195** — поле комментария `<textarea>` (многострочное), `rows={4}` — высота в четыре строки.
- **стр. 199–201** — общая ошибка от сервера, если есть.
- **стр. 203–209** — кнопка отправки: `type="submit"` — нажатие отправляет форму (вызывает `onSubmit`); `disabled={loading}` — пока ждём ответа, повторно нажать нельзя (иначе создалось бы два заказа); текст — «Redirecting to payment…» или «Proceed to Payment».

```jsx
213             <div className="border border-black/20 p-8 sticky top-8">
214               <h2 className="font-['Dorsa'] text-[48px] tracking-[8.64px] leading-none text-black mb-8 text-center">
215                 Your Order
216               </h2>
217
218               <div className="space-y-6 mb-8">
219                 {items.map((item) => (
220                   <div key={item.id} className="flex gap-4 items-start">
221                     <div className="w-16 h-16 bg-[#fafafa] flex-shrink-0 overflow-hidden border border-black/10">
222                       <img
223                         src={item.image}
224                         alt={item.name}
225                         className="w-full h-full object-cover"
226                         onError={(e) => { e.target.style.display = "none"; }}
227                       />
228                     </div>
229                     <div className="flex-1 min-w-0">
230                       <p className="font-['Centaur'] text-[16px] tracking-[2px] text-black truncate">{item.name}</p>
231                       <p className="font-['Centaur'] text-[14px] tracking-[1.5px] text-[#888]">Qty: {item.quantity}</p>
232                     </div>
233                     <p className="font-['Perpetua_Titling_MT'] text-[18px] tracking-[2px] text-black flex-shrink-0">
234                       ${(item.price * item.quantity).toFixed(2)}
235                     </p>
236                   </div>
237                 ))}
238               </div>
239
240               <div className="border-t border-black/10 pt-6 space-y-3">
241                 <div className="flex justify-between font-['Centaur'] text-[16px] tracking-[2.88px]">
242                   <span className="text-[#666]">Subtotal</span>
243                   <span className="text-black">${getTotalPrice().toFixed(2)}</span>
244                 </div>
245                 <div className="flex justify-between font-['Centaur'] text-[16px] tracking-[2.88px]">
246                   <span className="text-[#666]">Shipping</span>
247                   <span className="text-black">Free</span>
248                 </div>
249                 <div className="border-t border-black/10 pt-3 mt-3">
250                   <div className="flex justify-between font-['Dorsa'] text-[36px] tracking-[6.48px]">
251                     <span className="text-black">Total</span>
252                     <span className="text-black">${getTotalPrice().toFixed(2)}</span>
253                   </div>
254                 </div>
255               </div>
256
257               <Link
258                 to="/cart"
259                 className="block text-center font-['Centaur'] text-[14px] tracking-[2px] text-black/50 hover:text-black transition-colors mt-6 no-underline"
260               >
261                 ← Edit cart
262               </Link>
263             </div>
264           </div>
265         </div>
266       </div>
267     </div>
268   );
269 };
270
271 export default CheckoutPage;
```

- **стр. 219** — правая колонка: `items.map(...)` — строка на каждую позицию: фото, название, количество, сумма (`(цена × количество).toFixed(2)`).
- **стр. 226** — фото не загрузилось — спрятать.
- **стр. 243** — Subtotal — `getTotalPrice()` двумя знаками.
- **стр. 252** — Total — та же сумма (доставка бесплатная).
- **стр. 257–262** — ссылка «← Edit cart» — назад в корзину.
- **стр. 271** — экспорт.

## 14.3 front/src/pages/order/OrderSuccessPage.jsx — «Спасибо за заказ»

**Что это за файл.** Страница `/order-success`. Сюда **Stripe** возвращает покупателя после оплаты: `/order-success?session_id=cs_...` (адрес задан в `OrderController.js`, стр. 192). Страница очищает корзину и показывает номер заказа.
**Кто подключает:** `App.jsx` (адрес `/order-success`).
**Что подключает:** `useEffect`, `useState` (стр. 1); `Link`, `useSearchParams` (стр. 2); иконка (стр. 3); `useCart` (стр. 4); `api` (стр. 5).

```jsx
1  import React, { useEffect, useState } from 'react';
2  import { Link, useSearchParams } from "react-router-dom";
3  import { CheckCircle } from "lucide-react";
4  import { useCart } from "../../context/CartContext";
5  import api from "../../api";
6
7  const OrderSuccessPage = () => {
8    const [params] = useSearchParams();
9    const sessionId = params.get("session_id");
10   const { clearCart } = useCart();
11   const [order, setOrder] = useState(null);
12
13   // The payment went through, so empty the cart and show the order number.
14   useEffect(() => {
15     clearCart();
16     if (!sessionId) return;
17     api
18       .get(`/api/orders/by-session/${sessionId}`)
19       .then((response) => {
20         setOrder(response.data.data);
21       })
22       .catch((error) => {
23         console.log(error);
24       });
25     // This runs once when the page opens, so clearCart is left out on purpose.
26     // eslint-disable-next-line react-hooks/exhaustive-deps
27   }, [sessionId]);
```

- **стр. 8** — `useSearchParams()` — параметры после `?` в адресе. Возвращает пару, берём первый элемент — объект `params`.
- **стр. 9** — `params.get("session_id")` — значение параметра `session_id`: для `/order-success?session_id=cs_test_a1b2` — `'cs_test_a1b2'`. Если параметра нет — `null`.
- **стр. 10** — из корзины берём `clearCart`.
- **стр. 11** — `order` — краткие данные заказа, сначала `null`.
- **стр. 14** — эффект; `[sessionId]` в конце (стр. 27) — выполнить после первой отрисовки (и если id сменится).
- **стр. 15** — оплата прошла — очищаем корзину.
- **стр. 16** — id сессии нет (страницу открыли вручную) — больше ничего не делаем.
- **стр. 17–18** — `GET /api/orders/by-session/cs_test_a1b2` → на сервере `getOrderBySession`.
- **стр. 19–21** — ответ: `{ orderNumber, status, total, email }` — кладём в `order`.
- **стр. 22–24** — ошибка — в консоль (страница всё равно покажет общий текст).
- **стр. 25–26** — комментарий для ESLint: правило хочет, чтобы `clearCart` был в списке зависимостей, но тогда эффект запускался бы лишний раз. Строка `eslint-disable-next-line` отключает это правило для следующей строки.

```jsx
29   return (
30     <div className="bg-white min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center py-20">
31       <CheckCircle className="w-20 h-20 text-green-600/70" strokeWidth={1} />
32       <h1 className="font-['Dorsa'] text-[56px] md:text-[96px] tracking-[8px] md:tracking-[17px] leading-none text-black">
33         Thank You
34       </h1>
35
36       {order ? (
37         <p className="font-['Centaur'] text-[18px] md:text-[22px] tracking-[2px] text-[#666] max-w-[560px] leading-relaxed">
38           Your payment was successful and order{" "}
39           <span className="text-black font-semibold">{order.orderNumber}</span> is confirmed.
40           A receipt has been sent to <span className="text-black">{order.email}</span>.
41         </p>
42       ) : (
43         <p className="font-['Centaur'] text-[18px] md:text-[22px] tracking-[2px] text-[#666] max-w-[560px] leading-relaxed">
44           Your payment was successful and your order is confirmed. A receipt has been sent to your email.
45         </p>
46       )}
47
48       <Link
49         to="/"
50         className="mt-4 bg-black text-white font-['Perpetua_Titling_MT'] text-[16px] tracking-[2.88px] px-12 py-4 rounded-full hover:bg-black/80 transition-colors no-underline"
51       >
52         Back to Home
53       </Link>
54     </div>
55   );
56 };
57
58 export default OrderSuccessPage;
```

- **стр. 31** — зелёная галочка.
- **стр. 32–34** — «Thank You».
- **стр. 36** — данные заказа пришли — текст с номером заказа и почтой (стр. 37–41), иначе — общий текст без номера (стр. 43–45).
- **стр. 38** — `{" "}` — явный пробел: JSX убирает переносы строк вместе с пробелами, и без него слова «order» и номер склеились бы.
- **стр. 39** — номер заказа жирным.
- **стр. 40** — почта, на которую ушёл чек.
- **стр. 48–53** — кнопка «Back to Home».
- **стр. 58** — экспорт.

# Часть 15. Сайт: вход, регистрация, пароль

## 15.1 front/src/pages/login/LoginPage.jsx — вход и регистрация

**Что это за файл.** Страница `/login`: одна форма с двумя вкладками — Sign In (вход) и Register (регистрация).
**Кто подключает:** `App.jsx` (стр. 80), с пропсами `setToken` и `setUser`.
**Что подключает:** `useState` (стр. 1), `Link`, `useNavigate` (стр. 2), `api` (стр. 3).

### Состояние и функции (стр. 5–47)

```jsx
1  import React, { useState } from 'react';
2  import { Link, useNavigate } from "react-router-dom";
3  import api from "../../api";
4
5  const LoginPage = ({ setToken, setUser }) => {
6
7    const [isLogin, setIsLogin] = useState(true);
8    const [email, setEmail] = useState("");
9    const [password, setPassword] = useState("");
10   const [name, setName] = useState("");
11   const [showPassword, setShowPassword] = useState(false);
12   const [message, setMessage] = useState("");
13   const navigate = useNavigate();
14
15   const applyAuth = (data) => {
16     localStorage.setItem("token", data.token);
17     localStorage.setItem("user", JSON.stringify(data.user));
18     setToken(data.token);
19     setUser?.(data.user);
20     navigate(data.user?.role === "manager" || data.user?.role === "admin" ? "/admin" : "/");
21   };
```

- **стр. 5** — компонент; из `App.jsx` получает функции `setToken` и `setUser` — чтобы после входа весь сайт узнал о пользователе.
- **стр. 7** — `isLogin` — какая вкладка открыта: `true` — вход, `false` — регистрация.
- **стр. 8–10** — значения полей: почта, пароль, имя (имя нужно только при регистрации).
- **стр. 11** — `showPassword` — показывать пароль буквами или точками.
- **стр. 12** — `message` — текст ошибки от сервера.
- **стр. 13** — функция перехода.
- **стр. 15** — **функция `applyAuth(data)`** — что делать после успешного входа или регистрации. `data` — ответ сервера `{ token, user }`.
  - **стр. 16** — сохранить токен в браузере (`localStorage`) — он переживёт закрытие вкладки.
  - **стр. 17** — сохранить пользователя строкой (`JSON.stringify` — объект в строку; `localStorage` хранит только текст).
  - **стр. 18** — передать токен в `App`. `App` перерисуется: корзина перенесёт гостевые товары на сервер, `App` спросит `/api/auth/me`.
  - **стр. 19** — передать пользователя в `App`. `?.(...)` — вызвать, только если функцию передали.
  - **стр. 20** — куда перейти: менеджер или админ — на `/admin`, остальные — на главную (тернарный оператор). `data.user?.role` — `?.` на случай, если `user` нет.

```jsx
23   const handleSubmit = (e) => {
24     // Without preventDefault the browser would reload the page on submit.
25     e.preventDefault();
26     setMessage("");
27
28     // The same form is used for signing in and for registering.
29     const url = isLogin ? "/api/auth/signin" : "/api/auth/signup";
30     const body = isLogin ? { email, password } : { name, email, password };
31
32     api
33       .post(url, body)
34       .then((response) => {
35         applyAuth(response.data);
36       })
37       .catch((error) => {
38         console.log(error);
39         // The server explains what went wrong, for example "Invalid credentials".
40         setMessage(error.response?.data?.message || "Server error");
41       });
42   };
43
44   const toggleLoginMode = (mode) => {
45     setIsLogin(mode);
46     setMessage("");
47   };
```

- **стр. 23** — **функция `handleSubmit(e)`** — отправка формы. Вызывается формой (`onSubmit`, стр. 137).
- **стр. 25** — `e.preventDefault()` — отменить стандартную отправку формы (иначе браузер перезагрузил бы страницу).
- **стр. 26** — стереть прошлую ошибку.
- **стр. 29** — адрес запроса зависит от вкладки: вход — `/api/auth/signin`, регистрация — `/api/auth/signup`.
- **стр. 30** — тело запроса: для входа — почта и пароль, для регистрации — ещё и имя. `{ email, password }` — короткая запись `{ email: email, password: password }`.
- **стр. 32–33** — `api.post(адрес, тело)` — отправить. На сервере сначала проверка формы (`validateSignin` / `validateSignup`), потом `signin` / `signup`.
- **стр. 34–36** — успех — `applyAuth` с ответом (`response.data` = `{ token, user }`).
- **стр. 37–41** — ошибка: в консоль; показать текст от сервера (например «Invalid credentials» или «Email already exists»), а если ответа нет — «Server error». `error.response?.data?.message` — `?.` на каждом шаге: если сервер не ответил вообще, `error.response` нет, и получится `undefined`.
- **стр. 44** — **функция `toggleLoginMode(mode)`** — переключить вкладку: `mode` — `true` (вход) или `false` (регистрация).
- **стр. 45** — поставить вкладку.
- **стр. 46** — стереть ошибку прошлой вкладки.

### Разметка (стр. 49–257)

- **стр. 50–94** — левая чёрная половина экрана (только на больших экранах, `hidden lg:flex`): рамки, «welcome to», название магазина; **стр. 81–92** — ссылка на главную. Только оформление.

```jsx
96            <div className="flex border-b border-black/10 mb-12">
97              <button
98                type="button"
99                onClick={() => toggleLoginMode(true)}
100               className={`flex-1 pb-4 font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[3px] uppercase transition-all ${isLogin
101                 ? "text-black border-b-2 border-black -mb-px"
102                 : "text-black/30 hover:text-black/60"
103                 }`}
104             >
105               Sign In
106             </button>
107             <button
108               type="button"
109               onClick={() => toggleLoginMode(false)}
110               className={`flex-1 pb-4 font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[3px] uppercase transition-all ${!isLogin
111                 ? "text-black border-b-2 border-black -mb-px"
112                 : "text-black/30 hover:text-black/60"
113                 }`}
114             >
115               Create Account
116             </button>
117           </div>
118
119           <div className="mb-10">
120             <h2
121               className="text-black leading-none mb-3"
122               style={{
123                 fontFamily: "'Dorsa', sans-serif",
124                 fontSize: "64px",
125                 letterSpacing: "6px",
126               }}
127             >
128               {isLogin ? "SIGN IN" : "REGISTER"}
129             </h2>
130             <p className="font-['Centaur:Regular',sans-serif] text-black/40 text-[15px] tracking-[2px]">
131               {isLogin
132                 ? "Access your Darin's account"
133                 : "Join the Darin's community"}
134             </p>
135           </div>
```

- **стр. 97–116** — две вкладки-кнопки. `type="button"` — обычная кнопка: без этого кнопка внутри формы считалась бы кнопкой отправки.
  - **стр. 99** — «Sign In» — `toggleLoginMode(true)`;
  - **стр. 109** — «Register» — `toggleLoginMode(false)`;
  - **стр. 100, 110** — у активной вкладки чёрный текст и линия снизу, у другой — серый.
- **стр. 128** — заголовок: «SIGN IN» или «REGISTER».
- **стр. 131** — подзаголовок тоже зависит от вкладки.

```jsx
137           <form onSubmit={handleSubmit} className="space-y-6">
138             {!isLogin && (
139               <div className="space-y-2">
140                 <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
141                   Full Name
142                 </label>
143                 <input
144                   type="text"
145                   value={name}
146                   onChange={(e) => setName(e.target.value)}
147                   placeholder="Your name"
148                   required={!isLogin}
149                   className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors"
150                 />
151               </div>
152             )}
153
154             <div className="space-y-2">
155               <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
156                 Email
157               </label>
158               <input
159                 type="email"
160                 value={email}
161                 onChange={(e) => setEmail(e.target.value)}
162                 placeholder="your@email.com"
163                 required
164                 className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors"
165               />
166             </div>
167
168             <div className="space-y-2">
169               <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
170                 Password
171               </label>
172               <div className="relative">
173                 <input
174                   type={showPassword ? "text" : "password"}
175                   value={password}
176                   onChange={(e) => setPassword(e.target.value)}
177                   placeholder="••••••••"
178                   required
179                   className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors pr-10"
```

- **стр. 137** — форма; при отправке — `handleSubmit`.
- **стр. 138** — `{!isLogin && (...)}` — поле имени только на вкладке регистрации.
  - **стр. 145** — `value={name}` — показывать значение из состояния;
  - **стр. 146** — `onChange={(e) => setName(e.target.value)}` — при каждом вводе положить текст поля (`e.target.value`) в состояние `name`;
  - **стр. 148** — `required={!isLogin}` — обязательно только при регистрации (браузер не даст отправить пустым).
- **стр. 159–161** — поле почты: `type="email"`, значение и обновление — так же.
- **стр. 174** — поле пароля: `type={showPassword ? "text" : "password"}` — `"password"` показывает точки, `"text"` — буквы.
- **стр. 175–176** — значение и обновление пароля.

```jsx
181                 <button
182                   type="button"
183                   onClick={() => setShowPassword(!showPassword)}
184                   className="absolute right-0 bottom-3 text-black/30 hover:text-black/60 transition-colors"
185                 >
186                   <svg
187                     width="18"
188                     height="18"
189                     viewBox="0 0 24 24"
190                     fill="none"
191                     stroke="currentColor"
192                     strokeWidth="1.5"
193                     strokeLinecap="round"
194                     strokeLinejoin="round"
195                   >
196                     {showPassword ? (
197                       <>
198                         <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
199                         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
200                         <line x1="1" y1="1" x2="23" y2="23" />
201                       </>
202                     ) : (
203                       <>
204                         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
205                         <circle cx="12" cy="12" r="3" />
206                       </>
207                     )}
208                   </svg>
209                 </button>
```

- **стр. 181–209** — кнопка-глаз справа в поле пароля.
  - **стр. 183** — `setShowPassword(!showPassword)` — переключить: показывали — скрыть, скрывали — показать.
  - **стр. 186–208** — иконка рисуется SVG (векторная картинка из линий): `path`, `circle`, `line` — фигуры.
  - **стр. 196** — пароль виден — перечёркнутый глаз (стр. 197–201), скрыт — обычный глаз (стр. 203–206). `<>...</>` — «фрагмент»: обёртка, которая сама в HTML ничего не добавляет (нужна, потому что тернарный оператор должен вернуть один элемент).

```jsx
211             </div>
212
213             {isLogin && (
214               <div className="text-right">
215                 <Link
216                   to="/forgot-password"
217                   className="font-['Centaur:Regular',sans-serif] text-[13px] tracking-[2px] text-black/40 hover:text-black transition-colors no-underline"
218                 >
219                   Forgot password?
220                 </Link>
221               </div>
222             )}
223
224             {message && (
225               <div className="text-red-500 font-['Centaur:Regular',sans-serif] text-[15px] tracking-[1px]">
226                 {message}
227               </div>
228             )}
229
230             <div className="pt-4">
231               <button
232                 type="submit"
233                 className="w-full bg-[#050000] text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[4px] uppercase py-4 hover:bg-black/80 transition-colors"
234               >
235                 {isLogin ? "Sign In" : "Create Account"}
236               </button>
237             </div>
238           </form>
239
240
241           <p className="text-center mt-10 font-['Centaur:Regular',sans-serif] text-[14px] tracking-[2px] text-black/40">
242             {isLogin ? "Don't have an account? " : "Already have an account? "}
243             <button
244               type="button"
245               onClick={() => toggleLoginMode(!isLogin)}
246               className="text-black underline underline-offset-4 hover:opacity-60 transition-opacity"
247             >
248               {isLogin ? "Register" : "Sign In"}
249             </button>
250           </p>
251         </div>
252       </div>
253     </div>
254   );
255 };
256
257 export default LoginPage;
```

- **стр. 213–222** — ссылка «Forgot password?» на `/forgot-password` — только на вкладке входа.
- **стр. 224–228** — ошибка от сервера, если есть.
- **стр. 231–236** — кнопка отправки (`type="submit"`): текст «Sign In» или «Create Account».
- **стр. 241–250** — строка внизу: «Don't have an account? Register» или «Already have an account? Sign In». **стр. 245** — нажатие переключает на другую вкладку (`!isLogin` — противоположное значение).
- **стр. 257** — экспорт.

## 15.2 front/src/pages/login/ForgotPasswordPage.jsx — «Забыли пароль?»

**Что это за файл.** Страница `/forgot-password`: человек вводит почту, сервер отправляет на неё ссылку для нового пароля.
**Кто подключает:** `App.jsx` (адрес `/forgot-password`). Сюда ведёт ссылка «Forgot password?» на странице входа.
**Что подключает:** `useState` (стр. 1), `Link` (стр. 2), `api` (стр. 3).

```jsx
1  import React, { useState } from 'react';
2  import { Link } from "react-router-dom";
3  import api from "../../api";
4
5  const ForgotPasswordPage = () => {
6    const [email, setEmail] = useState("");
7    const [sent, setSent] = useState(false);
8    const [message, setMessage] = useState("");
9    const [loading, setLoading] = useState(false);
10
11   const handleSubmit = (e) => {
12     e.preventDefault();
13     setMessage("");
14     setLoading(true);
15
16     api
17       .post("/api/auth/forgot-password", { email })
18       .then((response) => {
19         setSent(true);
20         setMessage(response.data.message || "If an account exists, a reset link has been sent.");
21         setLoading(false);
22       })
23       .catch((error) => {
24         console.log(error);
25         setMessage(error.response?.data?.message || "Server error");
26         setLoading(false);
27       });
28   };
```

- **стр. 6** — `email` — что введено в поле.
- **стр. 7** — `sent` — запрос отправлен успешно: вместо формы показать сообщение.
- **стр. 8** — `message` — текст от сервера (успех или ошибка).
- **стр. 9** — `loading` — ждём ответа.
- **стр. 11** — **функция `handleSubmit(e)`** — отправка формы.
- **стр. 12** — отменить перезагрузку страницы.
- **стр. 13** — стереть прошлый текст.
- **стр. 14** — кнопка неактивна, текст «Sending…».
- **стр. 16–17** — `POST /api/auth/forgot-password` с `{ email }` → на сервере `forgotPassword`.
- **стр. 18–22** — ответ пришёл: `sent` — `true`; текст — от сервера (он всегда одинаковый: «If an account exists for that email, a reset link has been sent.» — так нельзя узнать, есть ли такая почта), а если текста нет — запасной; загрузка выключена.
- **стр. 23–27** — ошибка (например, превышен лимит 5 запросов в час): в консоль, текст от сервера или «Server error», загрузка выключена.

```jsx
43         {sent ? (
44           <div className="text-center space-y-8">
45             <p className="font-['Centaur:Regular',sans-serif] text-[16px] tracking-[1px] text-black/70 leading-relaxed">
46               {message}
47             </p>
48             <Link
49               to="/login"
50               className="inline-block bg-[#050000] text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[4px] uppercase px-12 py-4 no-underline hover:bg-black/80 transition-colors"
51             >
52               Back to Sign In
53             </Link>
54           </div>
55         ) : (
56           <form onSubmit={handleSubmit} className="space-y-8">
57             <div className="space-y-2">
58               <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
59                 Email
60               </label>
61               <input
62                 type="email"
63                 value={email}
64                 onChange={(e) => setEmail(e.target.value)}
65                 placeholder="your@email.com"
66                 required
67                 className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors"
68               />
69             </div>
70
71             {message && (
72               <p className="text-red-500 font-['Centaur:Regular',sans-serif] text-[15px] tracking-[1px]">
73                 {message}
74               </p>
75             )}
76
77             <button
78               type="submit"
79               disabled={loading}
80               className="w-full bg-[#050000] text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[4px] uppercase py-4 hover:bg-black/80 transition-colors disabled:opacity-60"
81             >
82               {loading ? "Sending…" : "Send Reset Link"}
83             </button>
84
85             <p className="text-center font-['Centaur:Regular',sans-serif] text-[14px] tracking-[2px] text-black/40">
86               <Link to="/login" className="text-black underline underline-offset-4 hover:opacity-60 transition-opacity">
87                 Back to Sign In
88               </Link>
89             </p>
90           </form>
91         )}
92       </div>
93     </div>
94   );
95 };
96
97 export default ForgotPasswordPage;
```

- **стр. 43** — `{sent ? (...) : (...)}` — отправлено — сообщение и ссылка «Back to Sign In» (стр. 44–54), иначе — форма (стр. 56–90).
- **стр. 56** — форма; при отправке — `handleSubmit`.
- **стр. 63–64** — поле почты: показывает `email` из состояния, при вводе кладёт туда текст (`e.target.value`).
- **стр. 66** — `required` — браузер не даст отправить пустое поле.
- **стр. 71–75** — текст ошибки, если есть.
- **стр. 79** — `disabled={loading}` — пока ждём, повторно нажать нельзя.
- **стр. 82** — текст кнопки: «Sending…» или «Send Reset Link».
- **стр. 86–88** — ссылка назад на вход.
- **стр. 97** — экспорт.

## 15.3 front/src/pages/login/ResetPasswordPage.jsx — новый пароль по ссылке из письма

**Что это за файл.** Страница `/reset-password?token=...`. Сюда ведёт ссылка из письма. Человек вводит новый пароль дважды, страница отправляет его вместе с токеном из адреса.
**Кто подключает:** `App.jsx` (адрес `/reset-password`).
**Что подключает:** `useState` (стр. 1); `Link`, `useSearchParams`, `useNavigate` (стр. 2); `api` (стр. 3).

```jsx
1  import React, { useState } from 'react';
2  import { Link, useSearchParams, useNavigate } from "react-router-dom";
3  import api from "../../api";
4
5  const ResetPasswordPage = () => {
6    const [params] = useSearchParams();
7    const token = params.get("token");
8    const navigate = useNavigate();
9
10   const [password, setPassword] = useState("");
11   const [confirm, setConfirm] = useState("");
12   const [message, setMessage] = useState("");
13   const [done, setDone] = useState(false);
14   const [loading, setLoading] = useState(false);
15
16   const handleSubmit = async (e) => {
17     e.preventDefault();
18     setMessage("");
19
20     if (password.length < 8) {
21       setMessage("Password must be at least 8 characters.");
22       return;
23     }
24     if (password !== confirm) {
25       setMessage("Passwords do not match.");
26       return;
27     }
28
29     setLoading(true);
30
31     api
32       .post("/api/auth/reset-password", { token, password })
33       .then((response) => {
34         setDone(true);
35         setMessage(response.data.message || "Password updated.");
36         setLoading(false);
37         // Give the visitor a moment to read the message, then go to the login page.
38         setTimeout(() => navigate("/login"), 1800);
39       })
40       .catch((error) => {
41         console.log(error);
42         setMessage(error.response?.data?.message || "Reset failed.");
43         setLoading(false);
44       });
45   };
```

- **стр. 6** — `useSearchParams()` — параметры после `?` в адресе.
- **стр. 7** — `params.get("token")` — токен из ссылки: для `/reset-password?token=9f86d081...` — `'9f86d081...'`. Нет параметра — `null`.
- **стр. 8** — функция перехода.
- **стр. 10–11** — новый пароль и его повтор.
- **стр. 12** — текст ошибки или успеха.
- **стр. 13** — `done` — пароль изменён.
- **стр. 14** — `loading` — ждём ответа.
- **стр. 16** — **функция `handleSubmit(e)`** — отправка. (Слово `async` здесь не нужно — внутри нет `await`, но и не мешает.)
- **стр. 17** — отменить перезагрузку.
- **стр. 18** — стереть прошлый текст.
- **стр. 20–23** — пароль короче 8 символов — показать ошибку и выйти, ничего не отправляя. (Сервер проверяет то же самое, но так человек узнаёт сразу.)
- **стр. 24–27** — пароль и повтор не совпадают (`!==`) — ошибка и выход.
- **стр. 29** — кнопка неактивна.
- **стр. 31–32** — `POST /api/auth/reset-password` с токеном и паролем → на сервере `resetPassword`.
- **стр. 33–39** — успех:
  - **стр. 34** — `done` — `true` (вместо формы — сообщение);
  - **стр. 35** — текст от сервера или запасной;
  - **стр. 36** — загрузка выключена;
  - **стр. 38** — `setTimeout(() => navigate("/login"), 1800)` — через 1,8 секунды перейти на страницу входа, чтобы человек успел прочитать сообщение.
- **стр. 40–44** — ошибка (ссылка устарела или уже использована): в консоль, текст от сервера («Reset link is invalid or has expired») или «Reset failed.», загрузка выключена.

```jsx
47   if (!token) {
48     return (
49       <div className="min-h-[calc(100vh-93px)] bg-white flex flex-col items-center justify-center px-6 gap-6 text-center">
50         <p className="font-['Dorsa',sans-serif] text-[56px] tracking-[6px] text-black">Invalid link</p>
51         <p className="font-['Centaur:Regular',sans-serif] text-[16px] tracking-[1px] text-black/60 max-w-[420px]">
52           This password reset link is missing its token. Please request a new one.
53         </p>
54         <Link
55           to="/forgot-password"
56           className="font-['Centaur:Regular',sans-serif] text-[15px] tracking-[2px] text-black underline underline-offset-4 hover:opacity-60"
57         >
58           Request a new link
59         </Link>
60       </div>
61     );
62   }
```

- **стр. 47** — в адресе нет токена (ссылку обрезали или открыли страницу вручную)…
- **стр. 48–61** — …показать «Invalid link» и ссылку «Request a new link» на `/forgot-password`. Форма не рисуется.

```jsx
77          {done ? (
78            <p className="text-center font-['Centaur:Regular',sans-serif] text-[16px] tracking-[1px] text-green-700">
79              {message} Redirecting to sign in…
80            </p>
81          ) : (
82            <form onSubmit={handleSubmit} className="space-y-8">
83              <div className="space-y-2">
84                <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
85                  New Password
86                </label>
87                <input
88                  type="password"
89                  value={password}
90                  onChange={(e) => setPassword(e.target.value)}
91                  placeholder="••••••••"
92                  required
93                  className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors"
94                />
95              </div>
96
97              <div className="space-y-2">
98                <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
99                  Confirm Password
100               </label>
101               <input
102                 type="password"
103                 value={confirm}
104                 onChange={(e) => setConfirm(e.target.value)}
105                 placeholder="••••••••"
106                 required
107                 className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors"
108               />
109             </div>
110
111             {message && (
112               <p className="text-red-500 font-['Centaur:Regular',sans-serif] text-[15px] tracking-[1px]">
113                 {message}
114               </p>
115             )}
116
117             <button
118               type="submit"
119               disabled={loading}
120               className="w-full bg-[#050000] text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[4px] uppercase py-4 hover:bg-black/80 transition-colors disabled:opacity-60"
121             >
122               {loading ? "Updating…" : "Update Password"}
123             </button>
124           </form>
125         )}
126       </div>
127     </div>
128   );
129 };
130
131 export default ResetPasswordPage;
```

- **стр. 77** — пароль изменён — сообщение (стр. 78–80), иначе — форма.
- **стр. 82** — форма; при отправке — `handleSubmit`.
- **стр. 88–90** — поле нового пароля: `type="password"` — точки вместо букв; значение из состояния; при вводе — в `password`.
- **стр. 102–104** — поле повтора — в `confirm`.
- **стр. 111–115** — текст ошибки, если есть.
- **стр. 118–122** — кнопка отправки: неактивна во время запроса; текст «Updating…» или «Update Password».
- **стр. 131** — экспорт.

# Часть 16. Сайт: страницы менеджера

Обе страницы открываются, только если `isManager` в `App.jsx` (стр. 89–96). Обе получают `token` пропсом и отправляют его в каждом запросе через `authHeader(token)`. На сервере каждый их запрос проходит `protect` + `restrictTo('manager', 'admin')`.

## 16.1 front/src/pages/admin/ManagerProductsPage.jsx — товары (`/admin`)

**Что это за файл.** Страница менеджера: слева форма «новый товар / изменить товар», справа все товары карточками с кнопками Edit и Delete.
**Кто подключает:** `App.jsx` (стр. 89–92) — только если `isManager`; передаёт `token`.
**Что подключает:** `useEffect`, `useState` (стр. 1), `Link` (стр. 2), `api`, `imageUrl`, `authHeader` (стр. 3).

### Пустая форма и состояние (стр. 5–23)

```jsx
1  import React, { useEffect, useState } from 'react';
2  import { Link } from "react-router-dom";
3  import api, { imageUrl, authHeader } from "../../api";
4
5  const EMPTY = {
6    model_name: "",
7    category: "bags",
8    price: "",
9    color_palette: "",
10   details: "",
11   style: "",
12   stock: "",
13 };
14
15 const ManagerProductsPage = ({ token }) => {
16   const [products, setProducts] = useState([]);
17   const [loading, setLoading] = useState(true);
18   const [form, setForm] = useState(EMPTY);
19   const [imageFile, setImageFile] = useState(null);
20   const [editingId, setEditingId] = useState(null);
21   const [filter, setFilter] = useState("all");
22   const [saving, setSaving] = useState(false);
23   const [message, setMessage] = useState(null);
```

- **стр. 5–13** — `EMPTY` — значения пустой формы. Всё строками (поля ввода работают со строками): категория по умолчанию `"bags"`, цвета/особенности/стиль — одной строкой через запятую (`"Pink, White"`), остаток — пустая строка («не отслеживать»).
- **стр. 15** — компонент; `token` — для запросов менеджера.
- **стр. 16** — `products` — все товары.
- **стр. 17** — `loading` — идёт первая загрузка.
- **стр. 18** — `form` — значения формы, сначала пустые.
- **стр. 19** — `imageFile` — выбранный файл картинки (объект `File` из браузера) или `null`.
- **стр. 20** — `editingId` — id товара, который сейчас редактируют; `null` — форма создаёт новый.
- **стр. 21** — `filter` — какую категорию показывать справа: `"all"`, `"bags"` или `"bracelets"`.
- **стр. 22** — `saving` — идёт сохранение (кнопка неактивна).
- **стр. 23** — `message` — сообщение `{ type: "success" | "error", text }` или `null`.

### Функции (стр. 26–123)

```jsx
25   // Brings the whole catalog into the table.
26   const loadProducts = () => {
27     api
28       .get("/api/products")
29       .then((response) => {
30         setProducts(response.data.data);
31         setLoading(false);
32       })
33       .catch((error) => {
34         console.log(error);
35         setMessage({ type: "error", text: "Failed to load products" });
36         setLoading(false);
37       });
38   };
39
40   useEffect(() => {
41     loadProducts();
42   }, []);
43
44   const resetForm = () => {
45     setForm(EMPTY);
46     setImageFile(null);
47     setEditingId(null);
48   };
49
50   const startEdit = (p) => {
51     setEditingId(p._id);
52     setForm({
53       model_name: p.model_name || "",
54       category: p.category || "bags",
55       price: p.price ?? "",
56       color_palette: (p.color_palette || []).join(", "),
57       details: (p.details || []).join(", "),
58       style: (p.style || []).join(", "),
59       stock: p.stock ?? "",
60     });
61     setImageFile(null);
62     window.scrollTo({ top: 0, behavior: "smooth" });
63   };
```

- **стр. 26** — **функция `loadProducts()`** — загрузить все товары. Вызывается при открытии (стр. 41), после сохранения (стр. 96) и после удаления (стр. 115).
  - **стр. 27–28** — `GET /api/products` (без токена — каталог открыт всем) → `getAllProducts`.
  - **стр. 29–32** — ответ: товары (`response.data.data`) в состояние, загрузка выключена.
  - **стр. 33–37** — ошибка: в консоль, красное сообщение, загрузка выключена.
- **стр. 40–42** — эффект с `[]` — загрузить товары один раз при открытии страницы.
- **стр. 44** — **функция `resetForm()`** — очистить форму: пустые значения, без файла, режим «новый товар». Вызывается после сохранения (стр. 95), кнопкой Cancel (стр. 156) и при удалении товара, который сейчас редактируют (стр. 113).
- **стр. 50** — **функция `startEdit(p)`** — кнопка Edit на карточке товара `p` (стр. 319).
  - **стр. 51** — запомнить, какой товар редактируем.
  - **стр. 52–60** — заполнить форму значениями товара:
    - **стр. 53–54** — название и категория; `|| ""` / `|| "bags"` — если поля нет;
    - **стр. 55** — цена: `p.price ?? ""`. `??` («nullish») берёт правую часть, только если левая — `null` или `undefined`. В отличие от `||`, цена `0` останется `0`, а не превратится в `""`;
    - **стр. 56–58** — массивы превращаем в строку для поля: `(p.color_palette || []).join(", ")` — `["Pink", "White"]` → `"Pink, White"`. `|| []` — если массива нет, `join` от пустого даст `""`;
    - **стр. 59** — остаток: `p.stock ?? ""` — остаток 0 останется 0, а `null` станет пустым полем.
  - **стр. 61** — файл не выбран (старая картинка останется, если новую не выберут).
  - **стр. 62** — `window.scrollTo({ top: 0, behavior: "smooth" })` — плавно прокрутить наверх, к форме.

```jsx
65    const handleSubmit = async (e) => {
66      e.preventDefault();
67      setMessage(null);
68
69      if (!editingId && !imageFile) {
70        setMessage({ type: "error", text: "Upload a product image" });
71        return;
72      }
73
74      const fd = new FormData();
75      fd.append("model_name", form.model_name);
76      fd.append("category", form.category);
77      fd.append("price", form.price);
78      fd.append("color_palette", form.color_palette);
79      fd.append("details", form.details);
80      fd.append("style", form.style);
81      fd.append("stock", form.stock);
82      if (imageFile) fd.append("image", imageFile);
83
84      setSaving(true);
85
86      // editingId is set when the manager pressed Edit on a row, so the same
87      // form both creates a new product and updates an existing one.
88      const request = editingId
89        ? api.put(`/api/products/${editingId}`, fd, authHeader(token))
90        : api.post("/api/products", fd, authHeader(token));
91
92      request
93        .then(() => {
94          setMessage({ type: "success", text: editingId ? "Product updated" : "Product added" });
95          resetForm();
96          loadProducts();
97          setSaving(false);
98        })
99        .catch((error) => {
100         console.log(error);
101         setMessage({ type: "error", text: error.response?.data?.message || "Save failed" });
102         setSaving(false);
103       });
104   };
```

- **стр. 65** — **функция `handleSubmit(e)`** — кнопка «Add product» / «Save changes» (форма, стр. 148).
- **стр. 66** — отменить перезагрузку страницы.
- **стр. 67** — стереть прошлое сообщение.
- **стр. 69–72** — новый товар (`!editingId`) **и** картинка не выбрана — ошибка и выход: на сервере картинка обязательна.
- **стр. 74** — `new FormData()` — встроенный объект браузера для отправки формы **с файлом** (формат `multipart/form-data`). JSON файл не передаёт — поэтому не обычный объект.
- **стр. 75–81** — `fd.append(имя, значение)` — добавить поле. Все текстовые поля формы. На сервере multer положит их в `req.body`.
- **стр. 82** — если выбрана картинка — добавить её под именем `"image"` (именно его ждёт `upload.single('image')` на сервере).
- **стр. 84** — кнопка неактивна.
- **стр. 88–90** — какой запрос отправить (тернарный оператор):
  - редактируем — `PUT /api/products/<id>` → `updateProduct`;
  - новый — `POST /api/products` → `createProduct`.
  - Оба — с токеном (`authHeader(token)`): на сервере `protect` и `restrictTo` пустят только менеджера.
  - `request` — Promise этого запроса; `.then` / `.catch` подключаем ниже одним кодом для обоих случаев.
- **стр. 92–98** — успех: зелёное сообщение «Product updated» или «Product added»; очистить форму; перезагрузить список; включить кнопку.
- **стр. 99–103** — ошибка: в консоль; красное сообщение с текстом сервера (например, ошибка проверки категории) или «Save failed»; включить кнопку.

```jsx
106   const handleDelete = (product) => {
107     if (!window.confirm(`Delete "${product.model_name}"?`)) return;
108     setMessage(null);
109
110     api
111       .delete(`/api/products/${product._id}`, authHeader(token))
112       .then(() => {
113         if (editingId === product._id) resetForm();
114         setMessage({ type: "success", text: "Product deleted" });
115         loadProducts();
116       })
117       .catch((error) => {
118         console.log(error);
119         setMessage({ type: "error", text: error.response?.data?.message || "Delete failed" });
120       });
121   };
122
123   const shown = products.filter((p) => filter === "all" || p.category === filter);
124
125   const inputClass =
126     "w-full border-b border-black/20 pb-2 pt-1 font-['Centaur'] text-[16px] tracking-[1px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors";
127   const labelClass =
128     "font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] text-black/50 uppercase block mb-2";
```

- **стр. 106** — **функция `handleDelete(product)`** — кнопка Delete (стр. 325).
- **стр. 107** — `window.confirm(текст)` — окно браузера «OK / Отмена». Возвращает `true`, если нажали OK, и `false`, если Отмена. `!` переворачивает: нажали Отмена — условие верно — выйти, ничего не удаляя.
- **стр. 108** — стереть сообщение.
- **стр. 110–111** — `DELETE /api/products/<id>` с токеном → `deleteProduct`.
- **стр. 112–116** — успех: если удалили товар, который сейчас в форме, — очистить форму; сообщение «Product deleted»; перезагрузить список.
- **стр. 117–120** — ошибка: в консоль и красное сообщение.
- **стр. 123** — `shown` — товары для показа справа. `filter` оставляет товар, если выбран фильтр «all» **или** (`||`) категория товара совпадает с фильтром.
- **стр. 125–128** — общие классы оформления полей и подписей.

### Разметка (стр. 130–342)

- **стр. 132–145** — чёрная шапка «Manager Studio»; **стр. 139–144** — ссылка «View Orders →» на `/admin/orders`.
- **стр. 147** — две колонки: форма (420px) и список.

```jsx
148         <form onSubmit={handleSubmit} className="lg:sticky lg:top-8 border border-black/10 p-6 space-y-6">
149           <div className="flex items-center justify-between">
150             <h2 className="font-['Dorsa'] text-[34px] tracking-[3px] leading-none">
151               {editingId ? "Edit product" : "New product"}
152             </h2>
153             {editingId && (
154               <button
155                 type="button"
156                 onClick={resetForm}
157                 className="font-['Perpetua_Titling_MT'] text-[10px] tracking-[2px] uppercase text-black/50 hover:text-black underline underline-offset-4"
158               >
159                 Cancel
160               </button>
161             )}
162           </div>
163
164           <div>
165             <label className={labelClass}>Name</label>
166             <input
167               className={inputClass}
168               value={form.model_name}
169               onChange={(e) => setForm((f) => ({ ...f, model_name: e.target.value }))}
170               placeholder="Dark Blue Beaded Mini Bag"
171               required
```

- **стр. 148** — форма; при отправке — `handleSubmit`. `lg:sticky` — на компьютере «прилипает» при прокрутке.
- **стр. 151** — заголовок: «Edit product» или «New product».
- **стр. 153–161** — кнопка Cancel только в режиме редактирования: `onClick={resetForm}` — вернуться к пустой форме.
- **стр. 166–170** — поле названия:
  - **стр. 168** — `value={form.model_name}` — показывает значение из состояния;
  - **стр. 169** — `onChange={(e) => setForm((f) => ({ ...f, model_name: e.target.value }))}` — при вводе: взять старую форму `f`, скопировать все поля (`...f`) и заменить одно — `model_name` — текстом из поля. Остальные поля формы устроены так же, меняется только имя поля.

```jsx
173           </div>
174
175           <div className="grid grid-cols-2 gap-4">
176             <div>
177               <label className={labelClass}>Category</label>
178               <select
179                 className={inputClass}
180                 value={form.category}
181                 onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
182               >
183                 <option value="bags">Bags</option>
184                 <option value="bracelets">Bracelets</option>
185               </select>
186             </div>
187             <div>
188               <label className={labelClass}>Price ($)</label>
189               <input
190                 className={inputClass}
191                 type="number"
192                 min="0"
193                 value={form.price}
194                 onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
195                 placeholder="120"
196                 required
197               />
198             </div>
199           </div>
200
201           <div>
202             <label className={labelClass}>Stock (units available — leave empty = unlimited)</label>
203             <input
204               className={inputClass}
205               type="number"
206               min="0"
207               value={form.stock}
208               onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
209               placeholder="e.g. 5 — empty means unlimited"
210             />
211           </div>
212
213           <div>
214             <label className={labelClass}>Colors (comma-separated)</label>
215             <input
216               className={inputClass}
217               value={form.color_palette}
218               onChange={(e) => setForm((f) => ({ ...f, color_palette: e.target.value }))}
219               placeholder="Dark Blue, White"
220             />
221           </div>
222
223           <div>
224             <label className={labelClass}>Details (comma-separated)</label>
225             <input
226               className={inputClass}
227               value={form.details}
228               onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
229               placeholder="Pearl handle, Ribbon bow"
230             />
231           </div>
232
233           <div>
234             <label className={labelClass}>Style (comma-separated)</label>
235             <input
236               className={inputClass}
237               value={form.style}
238               onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
239               placeholder="Glamorous, Romantic"
240             />
241           </div>
242
243           <div>
244             <label className={labelClass}>
245               Image {editingId && <span className="text-black/30">(leave empty to keep current)</span>}
246             </label>
247             <input
248               type="file"
249               accept="image/*"
250               onChange={(e) => setImageFile(e.target.files?.[0] || null)}
251               className="font-['Centaur'] text-[14px] text-black/70 file:mr-3 file:border file:border-black/20 file:bg-white file:px-3 file:py-1.5 file:font-['Perpetua_Titling_MT'] file:text-[10px] file:tracking-[2px] file:uppercase file:cursor-pointer hover:file:border-black"
252             />
253           </div>
```

- **стр. 178–185** — выпадающий список категории (`<select>`): два варианта `<option>`; выбранное значение — в `form.category`.
- **стр. 189–195** — цена: `type="number"` — поле для чисел.
- **стр. 203–209** — остаток: тоже число; пустое — «не отслеживать» (так подписано на стр. 202).
- **стр. 215–239** — цвета, особенности и стиль — текстом через запятую. Сервер превратит их в массивы (`toArray`).
- **стр. 245** — подпись к картинке; в режиме редактирования — подсказка «оставьте пустым, чтобы сохранить текущую».
- **стр. 247–251** — выбор файла:
  - `type="file"` — кнопка выбора файла;
  - `accept="image/*"` — в окне выбора показывать только картинки;
  - **стр. 250** — `e.target.files` — список выбранных файлов; `?.[0]` — первый (если списка нет — `undefined`); `|| null` — ничего не выбрали — `null`. Кладём в `imageFile`.

```jsx
255           {message && (
256             <p
257               className={`font-['Centaur'] text-[14px] tracking-[1px] ${
258                 message.type === "error" ? "text-red-600" : "text-green-700"
259               }`}
260             >
261               {message.text}
262             </p>
263           )}
264
265           <button
266             type="submit"
267             disabled={saving}
268             className="w-full py-4 bg-black text-white font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase hover:bg-black/80 transition-colors disabled:opacity-60 cursor-pointer"
269           >
270             {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
271           </button>
272         </form>
273
274         <div>
275           <div className="flex items-center gap-3 mb-6">
276             {["all", "bags", "bracelets"].map((c) => (
277               <button
278                 key={c}
279                 onClick={() => setFilter(c)}
280                 className={`px-4 py-2 border font-['Perpetua_Titling_MT'] text-[11px] tracking-[2px] uppercase transition-colors cursor-pointer ${
281                   filter === c ? "border-black bg-black text-white" : "border-black/20 text-black/60 hover:border-black/50"
282                 }`}
283               >
284                 {c}
285               </button>
286             ))}
287             <span className="ml-auto font-['Centaur'] text-[13px] tracking-[2px] text-black/40">
288               {shown.length} item{shown.length === 1 ? "" : "s"}
289             </span>
290           </div>
```

- **стр. 255–263** — сообщение, если есть: красное для `type: "error"`, зелёное для успеха.
- **стр. 265–271** — кнопка отправки: неактивна во время сохранения; текст — «Saving…», «Save changes» или «Add product» (вложенный тернарный оператор).
- **стр. 276–286** — кнопки фильтра: массив `["all", "bags", "bracelets"]` и сразу `.map` — по кнопке на значение; нажатие — `setFilter(c)`; выбранная — чёрная.
- **стр. 288** — «3 items» / «1 item»: `item` + `s`, если товаров не один.

```jsx
292           {loading ? (
293             <p className="font-['Centaur'] text-[20px] text-black/50 py-10">Loading…</p>
294           ) : shown.length === 0 ? (
295             <p className="font-['Centaur'] text-[18px] text-black/50 py-10">No products yet.</p>
296           ) : (
297             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
298               {shown.map((p) => (
299                 <div key={p._id} className="border border-black/10 flex flex-col">
300                   <div className="aspect-square bg-[#fafafa] overflow-hidden">
301                     <img src={imageUrl(p.file_name)} alt={p.model_name} className="w-full h-full object-cover" />
302                   </div>
303                   <div className="p-4 flex flex-col gap-1 flex-1">
304                     <p className="font-['Perpetua_Titling_MT'] text-[12px] tracking-[1.5px] uppercase">{p.model_name}</p>
305                     <p className="font-['Centaur'] text-[13px] tracking-[1px] text-black/50 capitalize">
306                       {p.category} · ${p.price}
307                     </p>
308                     <p className="font-['Centaur'] text-[12px] tracking-[1px] mt-0.5">
309                       {p.stock === null || p.stock === undefined ? (
310                         <span className="text-black/40">Unlimited stock</span>
311                       ) : p.stock === 0 ? (
312                         <span className="text-red-600">Out of stock</span>
313                       ) : (
314                         <span className="text-black/60">{p.stock} in stock</span>
315                       )}
316                     </p>
317                     <div className="mt-3 flex gap-2">
318                       <button
319                         onClick={() => startEdit(p)}
320                         className="flex-1 py-2 border border-black text-black font-['Perpetua_Titling_MT'] text-[10px] tracking-[2px] uppercase hover:bg-black/5 transition-colors cursor-pointer"
321                       >
322                         Edit
323                       </button>
324                       <button
325                         onClick={() => handleDelete(p)}
326                         className="flex-1 py-2 border border-red-600 text-red-600 font-['Perpetua_Titling_MT'] text-[10px] tracking-[2px] uppercase hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
327                       >
328                         Delete
329                       </button>
330                     </div>
331                   </div>
332                 </div>
333               ))}
334             </div>
335           )}
336         </div>
337       </div>
338     </div>
339   );
340 };
341
342 export default ManagerProductsPage;
```

- **стр. 292–297** — три варианта (вложенный тернарный оператор): пока грузится — «Loading…»; иначе если товаров для показа нет (`shown.length === 0`) — «No products yet»; иначе — сетка карточек.
- **стр. 298** — `shown.map((p) => ...)` — карточка на каждый показанный товар.
- **стр. 301** — фото через `imageUrl`.
- **стр. 304–306** — название, категория и цена.
- **стр. 309–315** — остаток (вложенный тернарный оператор): `null` или `undefined` — «Unlimited stock»; 0 — красное «Out of stock»; иначе «5 in stock».
- **стр. 318–323** — кнопка Edit — `startEdit(p)`.
- **стр. 324–329** — кнопка Delete — `handleDelete(p)`.
- **стр. 342** — экспорт.

## 16.2 front/src/pages/admin/ManagerOrdersPage.jsx — заказы (`/admin/orders`)

**Что это за файл.** Страница менеджера с заказами: сверху статистика продаж за период, ниже поиск, фильтр по статусу и список заказов. Заказ раскрывается по клику: контакты, адрес, позиции и смена статуса.
**Кто подключает:** `App.jsx` (стр. 93–96) — только если `isManager`; передаёт `token`.
**Что подключает:** `useEffect`, `useState` (стр. 1), `Link` (стр. 2), `api`, `authHeader` (стр. 3).

### Константы и помощники (стр. 5–27)

```jsx
1  import React, { useEffect, useState } from 'react';
2  import { Link } from "react-router-dom";
3  import api, { authHeader } from "../../api";
4
5  const STATUSES = ["all", "pending", "paid", "in_production", "shipped", "completed", "cancelled"];
6  const FLOW = ["pending", "paid", "in_production", "shipped", "completed", "cancelled"];
7
8  const STATUS_STYLE = {
9    pending: "bg-yellow-100 text-yellow-800",
10   paid: "bg-blue-100 text-blue-800",
11   in_production: "bg-purple-100 text-purple-800",
12   shipped: "bg-indigo-100 text-indigo-800",
13   completed: "bg-green-100 text-green-800",
14   cancelled: "bg-red-100 text-red-700",
15 };
16
17 const label = (s) => s.replace("_", " ");
18 const money = (n) => `$${Number(n || 0).toFixed(2)}`;
19
20 const StatCard = ({ label, value }) => {
21   return (
22     <div className="border border-black/10 p-6">
23       <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-2">{label}</p>
24       <p className="font-['Dorsa'] text-[40px] tracking-[2px] leading-none text-black">{value}</p>
25     </div>
26   );
27 };
```

- **стр. 5** — `STATUSES` — кнопки фильтра: «все» и шесть статусов.
- **стр. 6** — `FLOW` — статусы для выпадающего списка у заказа (без «all»).
- **стр. 8–15** — `STATUS_STYLE` — цвет плашки каждого статуса: ключ — статус, значение — классы Tailwind (`bg-green-100 text-green-800` — светло-зелёный фон, тёмно-зелёный текст).
- **стр. 17** — `label(s)` — статус для показа: `replace("_", " ")` меняет подчёркивание на пробел: `"in_production"` → `"in production"`.
- **стр. 18** — `money(n)` — формат денег: `Number(n || 0)` — число (если пусто — 0), `.toFixed(2)` — два знака: `570` → `"$570.00"`.
- **стр. 20–27** — компонент **`StatCard`** — одна плитка статистики: маленькая подпись (`label`) и крупное число (`value`). Используется на стр. 134–136.

### Состояние (стр. 29–37)

```jsx
29 const ManagerOrdersPage = ({ token }) => {
30   const [orders, setOrders] = useState([]);
31   const [loading, setLoading] = useState(true);
32   const [filter, setFilter] = useState("all");
33   const [search, setSearch] = useState("");
34   const [openId, setOpenId] = useState(null);
35   const [message, setMessage] = useState(null);
36   const [stats, setStats] = useState(null);
37   const [period, setPeriod] = useState("30");
```

- **стр. 30** — `orders` — список заказов.
- **стр. 31** — `loading` — идёт загрузка, сначала `true`.
- **стр. 32** — `filter` — выбранный статус, сначала `"all"`.
- **стр. 33** — `search` — текст в поле поиска.
- **стр. 34** — `openId` — id раскрытого заказа или `null` (раскрыт может быть только один).
- **стр. 35** — `message` — сообщение `{ type, text }` или `null`.
- **стр. 36** — `stats` — статистика с сервера, сначала `null`.
- **стр. 37** — `period` — за какой период статистика: `"7"`, `"30"` или `"all"`. Сначала 30 дней.

### Функции (стр. 40–100)

```jsx
39   // Reads the orders, filtered by status and by the search box.
40   const load = () => {
41     setLoading(true);
42
43     const params = new URLSearchParams();
44     if (filter !== "all") params.set("status", filter);
45     if (search.trim()) params.set("search", search.trim());
46
47     api
48       .get(`/api/orders?${params}`, authHeader(token))
49       .then((response) => {
50         setOrders(response.data.data);
51         setLoading(false);
52       })
53       .catch((error) => {
54         console.log(error);
55         setMessage({ type: "error", text: "Failed to load orders" });
56         setLoading(false);
57       });
58   };
59
60   useEffect(() => {
61     load();
62     // eslint-disable-next-line react-hooks/exhaustive-deps
63   }, [filter]);
```

- **стр. 40** — **функция `load()`** — загрузить заказы с учётом фильтра и поиска.
- **стр. 41** — включить «Loading…».
- **стр. 43** — `new URLSearchParams()` — встроенный объект для сборки строки параметров адреса.
- **стр. 44** — выбран статус (не «all») — добавить параметр `status=paid`.
- **стр. 45** — в поиске что-то есть (`search.trim()` — без пробелов по краям, пустая строка — «ложь») — добавить `search=anna`.
- **стр. 47–48** — запрос `GET /api/orders?status=paid&search=anna` с токеном. `${params}` в шаблонной строке сам превращается в текст `status=paid&search=anna`. На сервере — `getAllOrders`.
- **стр. 49–52** — ответ: заказы в состояние, загрузка выключена.
- **стр. 53–57** — ошибка: в консоль, красное сообщение, загрузка выключена.
- **стр. 60–63** — эффект: загрузить заказы при открытии и **каждый раз, когда меняется фильтр** (`[filter]`). Поиск сюда не входит — он запускается кнопкой (стр. 161), а не на каждую букву. Строка `eslint-disable-next-line` отключает подсказку ESLint, что `load` и `search` «надо» добавить в зависимости.

```jsx
65    // The small summary boxes at the top. If this call fails the page still
66    // works, so the error is only written to the console.
67    const loadStats = () => {
68      const query = period === "all" ? "" : `?days=${period}`;
69
70      api
71        .get(`/api/orders/stats${query}`, authHeader(token))
72        .then((response) => {
73          setStats(response.data.data);
74        })
75        .catch((error) => {
76          console.log(error);
77        });
78    };
79
80    useEffect(() => {
81      loadStats();
82      // eslint-disable-next-line react-hooks/exhaustive-deps
83    }, [period]);
84
85    // Moves one order along the flow: pending -> paid -> in production -> ...
86    const changeStatus = (id, status) => {
87      setMessage(null);
88
89      api
90        .patch(`/api/orders/${id}/status`, { status }, authHeader(token))
91        .then((response) => {
92          // Put the updated order back in the list without reloading everything.
93          setOrders((prev) => prev.map((order) => (order._id === id ? response.data.data : order)));
94          setMessage({ type: "success", text: "Status updated" });
95        })
96        .catch((error) => {
97          console.log(error);
98          setMessage({ type: "error", text: error.response?.data?.message || "Update failed" });
99        });
100   };
```

- **стр. 67** — **функция `loadStats()`** — загрузить статистику.
- **стр. 68** — параметр: «за всё время» — без параметра (`""`), иначе `?days=7` или `?days=30`.
- **стр. 70–71** — `GET /api/orders/stats?days=30` с токеном → на сервере `getStats`.
- **стр. 72–74** — ответ — в `stats`.
- **стр. 75–77** — ошибка — только в консоль: страница работает и без статистики (так сказано в комментарии на стр. 65–66).
- **стр. 80–83** — эффект: загрузить статистику при открытии и при смене периода (`[period]`).
- **стр. 86** — **функция `changeStatus(id, status)`** — сменить статус заказа. Вызывается выпадающим списком (стр. 262).
- **стр. 87** — стереть сообщение.
- **стр. 89–90** — `PATCH /api/orders/<id>/status` с `{ status }` и токеном → на сервере `updateOrderStatus`.
- **стр. 93** — заменить в списке только изменённый заказ, не перезагружая всё:
  - `setOrders((prev) => ...)` — функция получает старый список `prev`;
  - `prev.map((order) => (order._id === id ? response.data.data : order))` — новый массив, где у заказа с этим id стоит обновлённая версия от сервера, а остальные — как были.
- **стр. 94** — зелёное «Status updated».
- **стр. 96–99** — ошибка: в консоль, красное сообщение с текстом сервера (например «Invalid status») или «Update failed».

### Разметка (стр. 102–281)

- **стр. 104–111** — чёрная шапка «Orders».
- **стр. 154–159** — ссылка «← Products» обратно на `/admin`.

```jsx
114         {stats && (
115           <div className="mb-10">
116             <div className="flex items-center justify-between mb-4">
117               <h2 className="font-['Perpetua_Titling_MT'] text-[14px] tracking-[2px] uppercase">Sales overview</h2>
118               <div className="flex gap-2">
119                 {[["7", "7 days"], ["30", "30 days"], ["all", "All time"]].map(([v, l]) => (
120                   <button
121                     key={v}
122                     onClick={() => setPeriod(v)}
123                     className={`px-3 py-1 text-[11px] tracking-[1px] uppercase border cursor-pointer ${
124                       period === v ? "border-black bg-black text-white" : "border-black/20 text-black/50 hover:border-black/50"
125                     }`}
126                   >
127                     {l}
128                   </button>
129                 ))}
130               </div>
131             </div>
132
133             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
134               <StatCard label="Total Sales" value={money(stats.revenue)} />
135               <StatCard label="Orders" value={stats.orders} />
136               <StatCard label="Avg Order" value={money(stats.avgOrder)} />
137             </div>
138
139             {stats.topProducts?.length > 0 && (
140               <div className="border border-black/10 p-5">
141                 <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-3">Top products</p>
142                 {stats.topProducts.map((p, i) => (
143                   <div key={i} className="flex justify-between text-[14px] font-['Centaur'] py-1.5 border-b border-black/5 last:border-0">
144                     <span>{i + 1}. {p._id}</span>
145                     <span className="text-black/60">{p.qty} sold · {money(p.revenue)}</span>
146                   </div>
147                 ))}
148               </div>
149             )}
150           </div>
151         )}
152
```

- **стр. 114** — `{stats && (...)}` — блок статистики, только когда она загрузилась.
- **стр. 119** — массив пар `[значение, подпись]` и сразу `.map(([v, l]) => ...)` — по кнопке на период. `([v, l])` — деструктуризация пары прямо в параметре.
- **стр. 122** — нажатие — `setPeriod(v)` — эффект со стр. 80 перезагрузит статистику.
- **стр. 124** — выбранный период — чёрная кнопка.
- **стр. 134–136** — три плитки: выручка, число заказов, средний чек.
- **стр. 139** — топ товаров — только если он есть и не пустой.
- **стр. 142–146** — строка на каждый товар: название, «12 sold · $2160.00».

```jsx
153         <div className="flex items-center justify-between mb-6">
154           <Link
155             to="/admin"
156             className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[2px] uppercase text-black/60 hover:text-black no-underline"
157           >
158             ← Products
159           </Link>
160           <form
161             onSubmit={(e) => { e.preventDefault(); load(); }}
162             className="flex gap-2"
163           >
164             <input
165               value={search}
166               onChange={(e) => setSearch(e.target.value)}
167               placeholder="Search # / name / email"
168               className="border-b border-black/20 pb-1 text-[14px] tracking-[1px] bg-transparent outline-none focus:border-black w-[220px]"
169             />
170             <button className="font-['Perpetua_Titling_MT'] text-[10px] tracking-[2px] uppercase border border-black px-3 hover:bg-black/5 cursor-pointer">
171               Search
172             </button>
173           </form>
174         </div>
175
176         <div className="flex flex-wrap gap-2 mb-6">
177           {STATUSES.map((s) => (
178             <button
179               key={s}
180               onClick={() => setFilter(s)}
181               className={`px-4 py-2 border font-['Perpetua_Titling_MT'] text-[11px] tracking-[2px] uppercase transition-colors cursor-pointer ${
182                 filter === s ? "border-black bg-black text-white" : "border-black/20 text-black/60 hover:border-black/50"
183               }`}
184             >
185               {label(s)}
186             </button>
187           ))}
188         </div>
189
190         {message && (
191           <p className={`font-['Centaur'] text-[14px] mb-4 ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>
192             {message.text}
193           </p>
194         )}
```

- **стр. 160–161** — форма поиска. `onSubmit={(e) => { e.preventDefault(); load(); }}` — при отправке (Enter или кнопка): отменить перезагрузку страницы и загрузить заказы с текущим поиском. Две команды в одной строке разделены `;`.
- **стр. 165–166** — поле поиска: значение из `search`, при вводе — обновить `search`.
- **стр. 177–186** — кнопки статусов: `STATUSES.map(...)`; нажатие — `setFilter(s)` (эффект со стр. 60 перезагрузит список); текст — через `label(s)`.
- **стр. 190–194** — сообщение, если есть: красное или зелёное.

```jsx
196         {loading ? (
197           <p className="font-['Centaur'] text-[18px] text-black/50 py-10">Loading…</p>
198         ) : orders.length === 0 ? (
199           <p className="font-['Centaur'] text-[18px] text-black/50 py-10">No orders found.</p>
200         ) : (
201           <div className="space-y-3">
202             {orders.map((o) => (
203               <div key={o._id} className="border border-black/10">
204                 <button
205                   onClick={() => setOpenId(openId === o._id ? null : o._id)}
206                   className="w-full flex items-center gap-4 p-4 text-left cursor-pointer bg-transparent border-none hover:bg-black/[0.02]"
207                 >
208                   <span className="font-['Perpetua_Titling_MT'] text-[12px] tracking-[1px]">{o.orderNumber}</span>
209                   <span className="font-['Centaur'] text-[14px] text-black/70 flex-1 truncate">{o.customer?.name}</span>
210                   <span className="font-['Perpetua_Titling_MT'] text-[14px]">{money(o.total)}</span>
211                   <span className={`text-[11px] tracking-[1px] uppercase px-2 py-1 rounded ${STATUS_STYLE[o.status] || ""}`}>
212                     {label(o.status)}
213                   </span>
214                   <span className="font-['Centaur'] text-[12px] text-black/40 hidden md:inline">
215                     {new Date(o.createdAt).toLocaleDateString()}
216                   </span>
217                 </button>
218
```

- **стр. 196–200** — три варианта: грузится — «Loading…»; заказов нет — «No orders found.»; иначе — список.
- **стр. 202** — `orders.map((o) => ...)` — блок на каждый заказ.
- **стр. 204–217** — строка-заголовок заказа (кнопка):
  - **стр. 205** — нажатие: если этот заказ уже раскрыт (`openId === o._id`) — закрыть (`null`), иначе — раскрыть его;
  - **стр. 208–210** — номер, имя покупателя (`o.customer?.name` — `?.` на случай, если `customer` нет), сумма;
  - **стр. 211–213** — плашка статуса: цвет из `STATUS_STYLE[o.status]` (если статуса нет в таблице — `|| ""`, без цвета);
  - **стр. 215** — дата: `new Date(o.createdAt)` — строку даты из базы превращаем в дату; `.toLocaleDateString()` — показать в формате, принятом в браузере (`23.11.2026`).

```jsx
219                 {openId === o._id && (
220                   <div className="border-t border-black/10 p-5 bg-[#fafafa] space-y-4">
221                     <div className="grid md:grid-cols-2 gap-4 text-[14px] font-['Centaur'] tracking-[0.5px]">
222                       <div>
223                         <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-1">Customer</p>
224                         <p>{o.customer?.name}</p>
225                         <p className="text-black/60">{o.customer?.email}</p>
226                         <p className="text-black/60">{o.customer?.phone || "—"}</p>
227                       </div>
228                       <div>
229                         <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-1">Fulfilment</p>
230                         {o.deliveryMethod === "pickup" ? (
231                           <p>Self pickup</p>
232                         ) : (
233                           <p>{[o.shipping?.address, o.shipping?.city, o.shipping?.country].filter(Boolean).join(", ")}</p>
234                         )}
235                         {o.notes && <p className="text-black/60 mt-2">Notes: {o.notes}</p>}
236                       </div>
237                     </div>
238
239                     <div>
240                       <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-2">Items</p>
241                       {o.items.map((it, i) => (
242                         <div key={i} className="flex justify-between text-[14px] font-['Centaur'] py-1 border-b border-black/5">
243                           <span>
244                             {it.name}
245                             {it.custom && (
246                               <span className="text-black/40 text-[12px]">
247                                 {" "}({[it.custom.size, it.custom.strap, it.custom.chainColor, it.custom.color].filter(Boolean).join(" · ")})
248                               </span>
249                             )}
250                             <span className="text-black/40"> ×{it.quantity}</span>
251                           </span>
252                           <span>{money(it.price * it.quantity)}</span>
253                         </div>
254                       ))}
255                       <p className="text-right font-['Perpetua_Titling_MT'] text-[15px] mt-2">Total: {money(o.total)}</p>
256                     </div>
257
258                     <div className="flex items-center gap-3">
259                       <span className="text-black/40 uppercase text-[11px] tracking-[2px]">Status</span>
260                       <select
261                         value={o.status}
262                         onChange={(e) => changeStatus(o._id, e.target.value)}
263                         className="border border-black/20 px-3 py-2 text-[13px] tracking-[1px] bg-white outline-none focus:border-black cursor-pointer"
264                       >
265                         {FLOW.map((s) => (
266                           <option key={s} value={s}>{label(s)}</option>
267                         ))}
268                       </select>
269                     </div>
270                   </div>
271                 )}
272               </div>
273             ))}
274           </div>
275         )}
276       </div>
277     </div>
278   );
279 };
280
281 export default ManagerOrdersPage;
```

- **стр. 219** — подробности — только у раскрытого заказа.
- **стр. 224–226** — контакты: имя, почта, телефон (нет телефона — «—»).
- **стр. 230–234** — получение: самовывоз — «Self pickup», иначе адрес. `[адрес, город, страна].filter(Boolean).join(", ")` — убрать пустые части и склеить через запятую.
- **стр. 235** — комментарий покупателя, если есть.
- **стр. 241** — `o.items.map((it, i) => ...)` — строка на каждую позицию; `i` — номер, как `key`.
- **стр. 244** — название позиции.
- **стр. 245–249** — у сумки из конструктора — её параметры серым: `[размер, ремешок, цепочка, цвет].filter(Boolean).join(" · ")` → `(small · golden · pink)`. `{" "}` — пробел перед скобкой.
- **стр. 250** — «×2» — количество.
- **стр. 252** — сумма по позиции.
- **стр. 255** — итог заказа.
- **стр. 260–269** — выпадающий список статуса:
  - **стр. 261** — `value={o.status}` — выбран текущий статус заказа;
  - **стр. 262** — при выборе другого — `changeStatus(o._id, e.target.value)`: `e.target.value` — выбранное значение;
  - **стр. 265–267** — `FLOW.map(...)` — `<option>` на каждый статус: `value` — код (`in_production`), текст — `label(s)` (`in production`).
- **стр. 281** — экспорт.

# Часть 17. Сайт: юридические страницы

## 17.1 PrivacyPolicyPage.jsx и TermsOfServicePage.jsx

**Кто подключает:** `App.jsx` (адреса `/privacy-policy` и `/terms-of-service`). Сюда ведут ссылки в подвале.
**Что подключает:** только React. Логики нет, с сервером не общаются.

Обе устроены одинаково:
- **стр. 2–28** (в Privacy) — массив `sections`: объекты `{ title, body }` — заголовок раздела и его текст.
- **стр. 30** — компонент.
- **стр. 34–39** — заголовок страницы и дата обновления.
- **стр. 41–52** — `sections.map((s) => ...)` — для каждого раздела `<section>` с заголовком `h2` и абзацем. `key={s.title}` — заголовки уникальны.

Тексты: Privacy — какие данные собираются, как используются, как хранятся (пароли — только хешем), права пользователя, контакты. Terms — согласие с условиями, товары ручной работы и заказы из конструктора, оплата, доставка и самовывоз, аккаунты.

---

# Часть 18. Что в проекте не используется

Это стоит знать, если спросят «а это зачем?»:

| Что | Где | Состояние |
|---|---|---|
| `Header.css` | `front/src/shared/ui/` | нигде не подключается, шапка оформлена Tailwind |
| `react-image-magnifier-lens` | `front/package.json` | установлена, в коде не используется |
| `express-mongo-sanitize`, `xss-clean` | `back/package.json` | установлены, в `index.js` не подключены |
| `API` | `front/src/api.jsx`, стр. 18 | экспортируется, нигде не импортируется |
| `GET /api/orders/:id` | `ordersRoute.js`, стр. 24 | адрес работает, но ни одна страница его не вызывает |
| поле `avatar` у пользователя | `userModel.js`, стр. 21 | сохраняется и отдаётся, но на сайте не показывается |
