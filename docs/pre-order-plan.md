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

## Крок 5. Кошик — логіка
- [ ] Додати / змінити кількість / видалити, сума
- [ ] Кошик окремий для кожного бронювання, зберігається в браузері
- [ ] Лічильник на іконці кошика

## Крок 6. Кошик — вигляд
- [ ] Рядок: фото, назва, «Expected ready time», − 1 +, 🗑, ціна
- [ ] Роздільник під «Cart»; футер притиснутий донизу: «Grand Total» + зелена сума, «Submit Pre-Order»
- [ ] Порожній стан — замінити ілюстрацію `public/image/cart-empty.svg`

## Крок 7. Submit і «Pre-Order Submitted!» ⏳ чекає API бекенда
- [ ] ✓, «Your selections have been added to <ім'я>'s table», дані бронювання, «Your items», «Total»
- [ ] «Create New Pre-Order» → меню з порожнім кошиком для того самого бронювання
- [ ] Поки немає API — Submit неактивний з підказкою

## Крок 8. Сторінка Reservations — список бронювань (власник)
Бекенд готовий: `GET /bookings` (свої + ті, до яких приєднався), `POST /bookings/{id}/cancel`, `GET /bookings/{id}/invite`
- [ ] Картки бронювань у 3 колонки: статус зверху (Reserved / In Progress / Completed / Cancelled — свій колір), адреса, дата, час, гості
- [ ] Статус рахуємо на фронті: `CANCELLED` → Cancelled; зараз між `starts_at` і `ends_at` → In Progress; минуле → Completed; інакше Reserved
- [ ] 🗑 — скасувати бронювання (з підтвердженням; `CANCELLATION_CLOSED` → повідомлення)
- [ ] «Invite Guests» + текст «Share link with your guests…» — копіювати посилання-запрошення (toast «Link copied!»)
- [ ] «Add Pre-Order» → меню в режимі передзамовлення для цього бронювання
- [ ] Вкладки-фільтри «All (N)» / «Upcoming» / …
- [ ] ⏳ «Pre-orders: 4/4», «Group Pre-Order» — чекають API передзамовлення
- [ ] ⏳ «Leave Feedback» / «Update Feedback» — на бекенді немає відгуків

## Крок 9. Передзамовлення власника ⏳ чекає API бекенда
- [ ] Хедер власника: меню + Reservations + кошик з лічильником + профіль; та сама зелена смуга
- [ ] Кошик: підзаголовок «My Pre-Order»; Submit сірий, поки немає змін; після змін — «Cancel Changes» + «Submit Pre-Order»
- [ ] Модалка «Pre-Order Submitted»: «Your Pre-Order was sent successfully. Wait for the confirmation from the restaurant.» + «View Reservations»
- [ ] Модалка «Group Pre-Order» (мітка «Sent to Restaurant»): «My Pre-Order» + «Edit my Pre-Order», замовлення гостей, Subtotal, Grand Total
- [ ] Коментар до страви («No onions please», «Extra avocado»)

## Крок 10. Фінальна перевірка
- [ ] Мобільна і планшетна версії
- [ ] Оновлення сторінки, повторне відкриття посилання, запрошення закрилось під час замовлення
- [ ] Продакшн-збірка, перевірка `/join/...` на Vercel

## Відкриті питання
- Звідки «Expected ready time – 10 minutes»? (бекенд не віддає)
- Що бачить користувач після «Pre-Order»: toast, лічильник?
- API передзамовлення (кроки 7, 9) — уточнити у бекенда; станом на 2026-11-12 ендпоінтів немає
- API відгуків («Leave Feedback») — на бекенді немає
- Мітки страв «Vegetarian», «Lactose free» у модалці — бекенд не віддає (у `DishResponse` немає таких полів)
- Страви без фото в Group Pre-Order (кружечок з літерою «G», «F») — це страви з меню без `image_url`?
- Мобільні макети цих екранів
