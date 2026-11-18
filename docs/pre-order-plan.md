# Pre-order (гість і власник бронювання) — покроковий план

Макети Figma: «Guest. First time placing pre-order», «Guest. Create new pre-order».
Після кожного кроку: `tsc`, `eslint`, перевірка в браузері на 375 / 768 / 1440, коміт.

## Крок 1. API запрошень ✅
- [x] Типи `InvitePreview` (owner_first_name, starts_at, ends_at, party_size, table, location) і відповідь join (role, participants)
- [x] Route Handlers `GET /invites/{code}`, `POST /invites/{code}/join` — пересилають cookie в обидва боки (`guest_token`)
- [x] `getInvite(code)`, `joinInvite(code, name?)` у `lib/api/clientApi.ts`
- [x] Перевірка: неіснуючий код → `404 INVITE_NOT_FOUND`

## Крок 2. Режим передзамовлення (стан) ✅
- [x] `PreOrderProvider`: для якого бронювання замовляємо (код + дані бронювання), зберігається в браузері (без токенів)
- [x] Вмикається: власник — кнопка «Make Pre-Order» у «Reservation Confirmed»
- [x] Вмикається: гість — через `/join/<code>` (крок 3)
- [x] Вихід із режиму, якщо запрошення закрите / бронювання скасоване (`INVITE_CLOSED`)

## Крок 3. `/join/<code>` — модалка «You're Invited!» ✅
- [x] Фон — сторінка меню; «John invited you…», Restaurant / Location / Date / Time / Guests
- [x] «Enter Your Name» + «Browse Menu» (залогіненому поле не потрібне)
- [x] Стани: завантаження, не знайдено, закрите, столик заповнений (`BOOKING_FULL`), порожнє ім'я (`GUEST_NAME_REQUIRED`)
- [x] Після приєднання — режим увімкнено, відкрито меню

## Крок 4. Меню в режимі передзамовлення ✅
- [x] Зелена смуга: «You are making a pre-order for the reservation <адреса>, <стіл>, <дата>, <час>»
- [x] Хедер гостя: лише лого + кошик
- [x] «Sort by:» перед сортуванням; нижчий банер; жовтий фон
- [x] Картка страви: кнопка «Pre-Order» (у Sold Out — немає)
- [x] Модалка страви: велика кнопка «Pre-Order» праворуч від ціни

## Крок 5. Кошик — логіка ✅
- [x] Додати / змінити кількість / видалити, сума
- [x] Кошик окремий для кожного бронювання, зберігається в браузері
- [x] Лічильник на іконці кошика

## Крок 6. Кошик — вигляд ✅
- [x] Рядок: фото, назва, «Expected ready time», − 1 +, 🗑, ціна
- [x] Роздільник під «Cart»; футер притиснутий донизу: «Grand Total» + зелена сума, «Submit Pre-Order»
- [x] Порожній стан — ілюстрація `public/image/cart-basket.svg` (погоджено)

## Крок 7. Кошик на бекенді + Submit ✅ (2026-11-16)
Бекенд тепер тримає чернетку кошика сам — для кожного учасника бронювання (власник за сесією, гість за `guest_token`):
`GET /bookings/{id}/cart`, `PUT /bookings/{id}/cart/items/{dish_id}` `{quantity, note}`, `DELETE …/cart/items/{dish_id}`,
`POST /bookings/{id}/cart/submit` (частина фінальна, кошик стає порожнім), `GET /bookings/{id}/my-pre-order`.
- [x] Route Handlers для 5 запитів (пересилають cookie)
- [x] `CartProvider` переробити з localStorage на бекенд (useQuery + мутації); лічильник і кошик лишаються як є
- [x] «Expected ready time – N minutes» з `prep_minutes` замість 10 хв
- [x] Ціни з `line_total_cents` / `total_cents` (актуальні ціни меню)
- [x] Sold Out у кошику (`is_available: false`): не можна збільшити, Submit заблоковано (`DISH_UNAVAILABLE`)
- [x] Submit Pre-Order → екран «Pre-Order Submitted!»: ✓, «added to <ім'я>'s table», дані бронювання, «Your items», «Total»
- [x] «Create New Pre-Order» → меню з порожнім кошиком (бекенд сам його очищає)
- [x] Помилки: `PREORDER_CLOSED` (закрито / бронювання ще PENDING), `CART_EMPTY`, `QUANTITY_TOO_LARGE`
- [x] Нові статуси бронювання `PENDING` / `REJECTED` — врахувати на Reservations
- [x] Коментар до страви — поле `note` («+ Add comment» у кошику, до 200 символів)
- [x] Власник після Submit — модалка «Pre-Order Submitted» + «View Reservations»; гість — сторінка `/pre-order/submitted`

## Крок 8. Сторінка Reservations — список бронювань (власник) ✅
Бекенд готовий: `GET /bookings` (свої + ті, до яких приєднався), `POST /bookings/{id}/cancel`, `GET /bookings/{id}/invite`
- [x] Картки бронювань у 3 колонки: статус зверху (Reserved / In Progress / Completed / Cancelled — свій колір), адреса, дата, час, гості
- [x] Статус рахуємо на фронті: `CANCELLED` → Cancelled; зараз між `starts_at` і `ends_at` → In Progress; минуле → Completed; інакше Reserved
- [x] 🗑 — скасувати бронювання (з підтвердженням; `CANCELLATION_CLOSED` → повідомлення)
- [x] «Invite Guests» + текст «Share link with your guests…» — копіювати посилання-запрошення (toast «Link copied!»)
- [x] «Add Pre-Order» → меню в режимі передзамовлення для цього бронювання
- [x] Вкладки-фільтри «All (N)» / «Upcoming» / …
- [x] «Group Pre-Order» замість «Add Pre-Order» після відправки
- [x] «Pre-orders: 2 of 3» на картці власника (`GET /group-pre-order`, 2026-11-18)
- ~~«Leave Feedback» / «Update Feedback»~~ — відгуків у проєкті не буде (рішення 2026-11-16)

## Крок 9. Передзамовлення власника — частково ✅ (решта чекає API бекенда)
- [x] Хедер власника: меню + Reservations + кошик з лічильником + профіль; та сама зелена смуга
- [x] Кошик: підзаголовок «My Pre-Order»
- [x] «Cancel Changes» поруч із Submit (лише власник): з підтвердженням прибирає всі ще не відправлені страви
- [x] Модалка «Pre-Order Submitted»: «Your Pre-Order was sent successfully. Wait for the confirmation from the restaurant.» + «View Reservations»
- [x] Модалка «Group Pre-Order» (мітка «Sent to Restaurant»): «My Pre-Order», Subtotal, Grand Total
- [x] Замовлення гостей у Group Pre-Order (`GET /group-pre-order`, 2026-11-18)
- [x] Коментар до страви показується в кошику й Group Pre-Order
- [x] Поле для введення коментаря — і для власника, і для гостя

## Крок 10. Фінальна перевірка ✅
- [x] Мобільна і планшетна версії — 13 сторінок / модалок × 375, 768, 1440: без горизонтального скролу і помилок у консолі (2026-11-16)
- [x] Оновлення сторінки, повторне відкриття посилання, бронювання скасували / передзамовлення закрилось під час замовлення (`PREORDER_CLOSED`, 404 → перевірка бронювання, режим завершується з поясненням)
- [x] Продакшн-збірка, перевірка `/join/...` на Vercel

## Оновлення сесії ✅ (2026-11-16)
- [x] 401 → один `POST /auth/refresh` → повтор запиту (`lib/api/clientApi.ts`, інтерцептор axios)
- [x] Одночасні 401 чекають одне спільне оновлення (бекенд завершує всі сесії, якщо refresh-токен використати двічі)
- [x] Не оновлюємо для login / register / refresh / logout / verify-email / password-reset
- [x] Перед приєднанням за запрошенням залогінений спершу оновлює сесію (інакше бекенд приєднає його як гостя)

## Бронювання до 8 гостей ✅ (2026-11-16)
- [x] Форма: 1–8 гостей; «For groups larger than 8, please call us…»
- [x] 5–8 гостей: вікно «Request this table?» + «Send Request»; після — «Request Sent» без запрошення й передзамовлення
- [x] Помилки бронювання: `REQUEST_TOO_LATE`, `OVERLAPPING_BOOKING`, `SLOT_UNAVAILABLE`, `TABLE_NOT_SUITABLE`
- [x] Картка запиту (PENDING) на Reservations: без «Invite Guests» (код запрошення лише для підтвердженого)

## Нове на бекенді (2026-11-16), ще не зроблено
- Макет «Automatic pre-order hard lock (T-45)»: банер на Reservations і в Group Pre-Order «You have unconfirmed items in your pre-order. They will be canceled in 15 minutes.» — потрібні статуси страв від бекенда
- Сповіщення `GET /notifications` (BOOKING_REQUEST_APPROVED / REJECTED) — можливо, це помаранчева крапка на картці
- Немає API для Group Pre-Order власника (замовлення гостей, статуси Sent/Confirmed/Rejected, Remove Guest, «Pre-orders N/M»)

## Відкриті питання
- Звідки «Expected ready time – 10 minutes»? (бекенд не віддає)
- Що бачить користувач після «Pre-Order»: toast, лічильник?
- API передзамовлення (кроки 7, 9) — уточнити у бекенда; станом на 2026-11-12 ендпоінтів немає
- Мітки страв «Vegetarian», «Lactose free» у модалці — бекенд не віддає (у `DishResponse` немає таких полів)
- Страви без фото в Group Pre-Order (кружечок з літерою «G», «F») — це страви з меню без `image_url`?
- Мобільні макети цих екранів

## Waiter View (роль офіціанта) — макети отримано 2026-11-16, ⏳ чекає бекенда
Макети: «Reservations. Waiter view. No pre-order / Pre-order created», «Cancel Reservation modal», «Reservation Pre-Order modal states».
- Хедер офіціанта: Reservations + Menu + 🔔 + профіль; «Hello, <name> (Waiter)»
- Фільтри: дата, час, стіл, 🔍, «+ New Reservation»
- Картки всіх гостей: ім'я власника, вибір столу, 🗑 / ✏️, кнопки Create / Edit / View Order, Submit / View Pre-order
- Модалка «Reservation Pre-Order»: Owner / Guest блоки, ✓ / ✕ на кожній страві, статуси Created by Customer → Updated → Confirmed by Restaurant, Submit власнику, режим перегляду
- На бекенді є лише: `GET /staff/booking-requests`, `POST …/approve`, `POST …/reject` (запити 5–8 гостей). Немає: ролі в `/auth/me`, списку всіх бронювань, призначення столу, дашборду передзамовлення, ✓/✕ страв

## Reservations за новими макетами власника ✅ (2026-11-16)
- [x] «Invite Guests» → модалка «Guest Invite link» (локація, дата, час, гості, посилання + копіювання → toast «Link copied!»)
- [x] «Invite Guests» лише коли гостей > 1 («1 Guest = Owner»)
- [x] «Cancel Reservation»: тексти з Figma, «Keep it» (текстова) + «Cancel» (червона обводка), toast «Reservation Cancelled!»
- [x] «Add Pre-Order» → «Group Pre-Order», щойно учасник відправив своє передзамовлення (`GET /my-pre-order`)
- [x] Модалка «Group Pre-Order» (мітка «Sent to Restaurant»): лише блок «My Pre-Order» — однакові страви з різних відправлень разом; «Add more dishes» → меню
- [x] Блоки гостей і «Pre-orders N/M» (2026-11-18)
- [ ] ⏳ «Remove Guest», статуси Confirmed / Rejected — чекають API бекенда
- [ ] Вкладки з підкресленням і окремою «In Progress» — макет позначений Backlog

## Сторінка персоналу «Booking Requests» ✅ (2026-11-16)
Бекенд: `GET /staff/booking-requests`, `POST …/{id}/approve`, `POST …/{id}/reject` (лише персонал, інакше 403 STAFF_ONLY)
- [x] `/staff/requests`: картки запитів 5–8 гостей (ім'я, гості, дата, час, стіл, локація, коли створено), пагінація по 20
- [x] Попередження «N other requests want this table at this time» (`competing_requests`)
- [x] Approve одразу; Reject — через вікно підтвердження; після рішення список оновлюється (конкуренти зникають)
- [x] Помилки: `SLOT_UNAVAILABLE`, `REQUEST_EXPIRED`, `REQUEST_NOT_PENDING`
- [x] Пункт «Requests» у хедері — лише для персоналу (ролі в `/auth/me` немає, тож перевіряємо доступ до списку)
- [x] Звичайний користувач — «available to restaurant staff only»; гість — «Sign in with a staff account»
- Макета немає — зроблено в стилі карток Reservations

## Запрошення — звірка з описом бекенда ✅ (2026-11-17)
Опис: один спільний код у власника; будь-хто з кодом бачить публічний перегляд; друзі приєднуються з акаунтом або без; приєднані гості рахуються в розмір компанії.
- [x] Посилання-запрошення і для запиту (PENDING, 5–8 гостей): у модалці «Request Sent» і на картці (Invite Guests), якщо гостей > 1
- [x] «You're Invited!» показує статус: для запиту — жовта примітка й кнопка «Join Reservation»; після приєднання — «You've joined!» без режиму передзамовлення (воно відкриється після підтвердження)
- [x] Картка в Reservations: «Joined: X of N» та імена учасників (власник — «(host)»)
- Перевірено в браузері на підставлених даних: картки, Request Sent, перегляд запрошення PENDING/CONFIRMED, приєднання

## Групове передзамовлення власника ✅ (2026-11-18)
Бекенд: `GET /bookings/{id}/group-pre-order` — лише власнику; учасники (власник першим, далі гості за порядком приєднання) з відправленими частинами, сума кожного і загальна. Чернеток немає. Відкрито в будь-якому статусі.
- [x] Route Handler + `getGroupPreOrder`, типи `GroupPreOrder`, `ParticipantPreOrder`
- [x] Картка власника: «Pre-orders: N of M» (відправили / приєдналися); «Group Pre-Order», щойно хоч хтось відправив
- [x] Модалка: «My Pre-Order» + блок кожного гостя (мітка Guest/Host), «Hasn't pre-ordered yet», Subtotal кожного, «N more guests haven't joined yet», Grand Total компанії
- [x] Після початку / завершення бронювання власник може переглянути Group Pre-Order (без «Add more dishes»)
- [x] Гість, як і раніше, бачить лише своє (`GET /my-pre-order`)
- [x] Після Submit оновлюються і my-pre-order, і group-pre-order

## Edit Reservation ✅ (2026-11-18, без макета Figma — у стилі наявних модалок)
Бекенд: `PUT /bookings/{id}` `{ starts_at, party_size, duration_minutes }`, `GET /bookings/{id}/slots?duration_minutes=`. День і стіл змінити не можна.
- [x] Route Handlers: `PUT /bookings/[id]`, `GET /bookings/[id]/slots`; `editBooking`, `getEditSlots`
- [x] ✏️ на картці — лише власнику, лише для підтвердженого майбутнього бронювання до 4 гостей (великі можна тільки скасувати)
- [x] Модалка: Guests (не менше, ніж уже приєдналось; не більше 4 і місткості столу), Length of stay, сітка часу, Save Changes / Cancel
- [x] Межі тривалості бекенд не називає → питаємо `/slots` для 1–5 год і показуємо лише ті, що він приймає
- [x] Обраний час скидається, якщо при новій тривалості він уже не підходить
- [x] Помилки за `code`: SLOT_UNAVAILABLE (оновлюємо сітку), OVERLAPPING_BOOKING, PARTY_BELOW_PARTICIPANTS, ENDS_AFTER_CLOSING…; EDIT_CLOSED / BOOKING_PENDING / LARGE_BOOKING_NOT_EDITABLE → пояснення замість форми
- [x] Успіх → toast «Reservation Updated!», список оновлюється; режим передзамовлення підхоплює новий час
