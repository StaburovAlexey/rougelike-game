# Конфиг подтипов дверей

Конфиг подтипов дверей находится в `subtypeDoors.js`.

У каждого подтипа двери есть две части:

1. Шанс появления в `SUBTYPES_DOORS_CHANCES`.
2. Список эффектов в `SUBTYPES_DOORS_EFFECTS`.

Если у подтипа должен быть значок на двери, добавь текстуру с таким же ключом в
`src/game/core/textureManager.js`.

## Конфиг шанса

```js
{ type: "hell", chance: 3, minLevel: 6 }
```

- `type`: id подтипа. Должен совпадать с ключом в `SUBTYPES_DOORS_EFFECTS`.
- `chance`: относительный вес появления.
- `minLevel`: первый индекс уровня, с которого этот подтип может появляться.

Одна выходная дверь всегда принудительно становится `normal`.

## Конфиг эффектов

Каждый подтип использует массив `effects`:

```js
hell: {
  effects: [
    { type: "enemyCountMultiplier", value: 2 },
    { type: "extraReward", count: 1 },
  ],
}
```

Эффекты выполняются по порядку. Порядок важен:

```js
effects: [
  { type: "enemyCountAdd", value: 3 },
  { type: "enemyStatsMultiplier", hp: 1.5 },
]
```

В этом примере сначала добавятся враги, потом усилятся все враги.

## Доступные эффекты

### noEnemy

Убирает всех врагов из комнаты.

```js
{ type: "noEnemy" }
```

### shopLevel

Создает безопасную комнату магазина. Сейчас просто убирает всех врагов.

```js
{ type: "shopLevel" }
```

### groundLoot

Добавляет лут на пол.

```js
{
  type: "groundLoot",
  category: "gold",
  count: 3,
}
```

Поля:

- `category`: `"gold"`, `"heal"`, `"random"` или `"legendary"`.
- `count`: количество предметов.
- `exclude`: необязательный список типов лута, которые нужно исключить из случайного выбора.
- `enemyCount`: необязательное количество дополнительных врагов вместе с этим лутом.

Примеры:

```js
{ type: "groundLoot", category: "gold", count: 3 }
{ type: "groundLoot", category: "heal", count: 1 }
{ type: "groundLoot", category: "random", count: 2, exclude: ["gold", "heal"] }
{ type: "groundLoot", category: "legendary", count: 1 }
```

### enemyCountAdd

Добавляет фиксированное количество врагов.

```js
{ type: "enemyCountAdd", value: 3 }
```

Можно использовать:

- `value`
- `count`

### enemyCountMultiplier

Добавляет врагов относительно текущего количества врагов.

```js
{ type: "enemyCountMultiplier", value: 2 }
```

`value: 2` означает, что в комнате будет примерно в два раза больше врагов.

### enemyStatsMultiplier

Умножает характеристики всех врагов.

```js
{
  type: "enemyStatsMultiplier",
  hp: 1.3,
  atk: 1.2,
  def: 1,
}
```

Поля необязательные. Если поле не указано, используется множитель `1`.

Значения меньше `1` ослабляют врагов:

```js
{ type: "enemyStatsMultiplier", hp: 0.75, atk: 0.8 }
```

### enemyStatsAdd

Добавляет плоские значения к характеристикам всех врагов.

```js
{
  type: "enemyStatsAdd",
  hp: 2,
  atk: -1,
  def: 0,
}
```

Ограничения:

- `hp` не может стать меньше `1`.
- `atk` не может стать меньше `0`.
- `def` не может стать меньше `0`.

### extraReward

Добавляет дополнительные предметы в награду за уровень.

```js
{ type: "extraReward", count: 1 }
```

Награда учитывает текущий индекс уровня и бонус редкости игрока.

### playerModifier

Добавляет временный модификатор игроку.

```js
{
  type: "playerModifier",
  stat: "lightRadius",
  value: -1,
  roomsLeft: 1,
}
```

Поля:

- `stat`: id модификатора.
- `value`: плоское значение для additive-модификаторов.
- `multiplier`: множитель для multiplier-модификаторов.
- `roomsLeft`: сколько комнат действует модификатор.
- `turnsLeft`: сколько ходов игрока действует модификатор.

Поддерживаемые `stat`:

```js
"damagePerTurn"
"damageMultiplier"
"lightRadius"
```

Примеры:

```js
// Игрок получает 1 урон после каждого действия в течение одной комнаты.
{ type: "playerModifier", stat: "damagePerTurn", value: 1, roomsLeft: 1 }

// Игрок наносит на 20% меньше урона в течение одной комнаты.
{ type: "playerModifier", stat: "damageMultiplier", multiplier: 0.8, roomsLeft: 1 }

// Игрок видит на одну клетку меньше в течение одной комнаты.
{ type: "playerModifier", stat: "lightRadius", value: -1, roomsLeft: 1 }
```

## Полные примеры

### Сложная комната с лучшей наградой

```js
hardReward: {
  effects: [
    { type: "enemyCountAdd", value: 4 },
    { type: "enemyStatsMultiplier", hp: 1.25, atk: 1.15 },
    { type: "extraReward", count: 1 },
  ],
}
```

### Проклятая темная комната

```js
cursedDark: {
  effects: [
    { type: "enemyCountMultiplier", value: 1.5 },
    { type: "playerModifier", stat: "lightRadius", value: -1, roomsLeft: 1 },
    { type: "playerModifier", stat: "damagePerTurn", value: 1, roomsLeft: 1 },
  ],
}
```

### Слабые враги, больше лута

```js
easyLoot: {
  effects: [
    { type: "enemyStatsMultiplier", hp: 0.7, atk: 0.75 },
    { type: "groundLoot", category: "random", count: 2, exclude: ["heal"] },
  ],
}
```

## Как добавить новый подтип двери

1. Добавь шанс:

```js
{ type: "cursedDark", chance: 6, minLevel: 3 }
```

2. Добавь эффекты:

```js
cursedDark: {
  effects: [
    { type: "enemyCountMultiplier", value: 1.5 },
    { type: "playerModifier", stat: "lightRadius", value: -1, roomsLeft: 1 },
  ],
}
```

3. Добавь текстуру:

```js
cursedDark: "/doors/cursedDark.png",
```

Если текстуры нет, дверь все равно может работать логически, но значок подтипа
на двери не отрисуется.
