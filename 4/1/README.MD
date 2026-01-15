## Содержание
- [Generics](#generics)
    - [Generics особенно полезны при проектировании](#-Generics-особенно-полезны-при-проектировании)
    - [Generic-репозиторий (аналог Spring Data Repository)](#--Generic-репозиторий-аналог-Spring-Data-Repository)
    - 🔄 [Generic API-клиент для внешних сервисов](#--Generic-API-клиент-для-внешних-сервисов)
    - ⚙ [️Generic-сервис с обработкой ошибок](#-Generic-сервис-с-обработкой-ошибок)
    - [DTO с валидацией через generics](#-DTO-с-валидацией-через-generics)
    - [Generic-маппер (Entity ↔ DTO)](#-Generic-маппер-Entity--DTO)
- [Conditional types](#-Conditional-types)
    - 🔹 [Основы](#--Основы)
        - [Пример 1: Простой conditional type](#-Приме-1-Просто-conditiona-type)
    - 🔸 [Практические use cases в бэкенде](#--Практические-use-cases-в-бэкенде)
        - [Извлечение типа ответа из API-метода](#-Извлечение-типа-ответа-из-API-метода)
        - [Утилита Exclude / Extract (встроенные, но полезно понимать)](#-Утилита-Exclude--Extract-встроенные-но-полезно-понимать)
        - [Условное преобразование DTO ↔ Entity](#-Условное-преобразование-DTO--Entity)
        - [Безопасный обработчик ошибок с conditional types](#-Безопасный-обработчик-ошибок-с-conditional-types)
        - [Условные middleware-типы (NestJS / Express)](#-Условные-middleware-типы-NestJS--Express)
    - 🔹 [Распространённые встроенные conditional types](#--Распространённые-встроенные-conditional-types)
        - [Распространённые встроенные conditional types в TypeScript](#-Распространённые-встроенные-conditional-types-в-TypeScript)
        - 💡 [Совет для бэкенд-разработчика](#--Совет-для-бэкенд-разработчика)
- [Decorators](#-Decorators)
    - 🔹 [Синтаксис](#--Синтаксис)
    - 🔸 [Типы декораторов](#--Типы-декораторов)
        - [Декоратор класса](#-Декоратор-класса)
        - [Декоратор метода](#-Декоратор-метода)
        - [Декоратор свойства](#-Декоратор-свойства)
        - [Декоратор параметра](#-Декоратор-параметра)
    - 🔥 [Практическое применение в бэкенде](#--Практическое-применение-в-бэкенде)
        - ✅ [ NestJS (аналог Spring Boot для Node.js)](#--NestJS-аналог-Spring-Boot-для-Nodejs)
        - ✅ [ Валидация DTO (с class-validator)](#--Валидация-DTO-с-class-validator)
        - ✅ [ Логирование, кэширование, метрики](#--Логирование-кэширование-метрики)
        - ⚠ [️ Ограничения](#--Ограничения)

# Generics

## [↑](#Содержание) Generics особенно полезны при проектировании:

- API-клиентов  
- Репозиториев / сервисов  
- DTO и валидаторов  
- Middleware и обработчиков ошибок
- Универсальных утилит для работы с данными

Вот практические примеры generics в бэкенде на TypeScript (например, с использованием Node.js + Express или NestJS):

____

## [↑](#Содержание) 📦 Generic-репозиторий (аналог Spring Data Repository)

```ts
interface IEntity {
  id: string | number;
}

abstract class BaseRepository<T extends IEntity> {
  protected items: T[] = [];

  findById(id: T['id']): T | undefined {
    return this.items.find(item => item.id === id);
  }

  save(item: T): T {
    const existingIndex = this.items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      this.items[existingIndex] = item;
    } else {
      this.items.push(item);
    }
    return item;
  }

  deleteById(id: T['id']): boolean {
    const initialLength = this.items.length;
    this.items = this.items.filter(i => i.id !== id);
    return this.items.length < initialLength;
  }
}

// Использование:
interface User extends IEntity {
  id: string;
  name: string;
  email: string;
}

class UserRepository extends BaseRepository<User> {}

const userRepo = new UserRepository();
userRepo.save({ id: "1", name: "Мурад", email: "m@example.com" });
```

> 💡 Это похоже на JpaRepository<User, String> в Spring Boot — только на TypeScript.

## [↑](#Содержание) 🔄 Generic API-клиент для внешних сервисов

```ts
type ApiResponse<T> = {
  data: T;
  status: number;
  timestamp: string;
};

async function fetchFromAPI<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  const data = await res.json();
  return {
    data,
    status: res.status,
    timestamp: new Date().toISOString()
  };
}

// Использование:
interface WeatherData {
  temperature: number;
  city: string;
}

const weather = await fetchFromAPI<WeatherData>('/api/weather');
console.log(weather.data.temperature); // типизировано!
```

## [↑](#Содержание)️ Generic-сервис с обработкой ошибок

```ts
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

class UserService {
  async getUserById(id: string): Promise<Result<User>> {
    try {
      const user = await db.users.findById(id); // предположим, что db — ORM
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// Можно сделать универсальный метод:
async function safeCall<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```

> Такой паттерн (Result<T>) часто используется вместо выбрасывания исключений — особенно в функциональном стиле или когда нужно явно обрабатывать ошибки.

## [↑](#Содержание) DTO с валидацией через generics

```ts
interface ValidationRule<T> {
  validate(value: T): boolean;
  message: string;
}

class Validator<T> {
  private rules = new Map<keyof T, ValidationRule<any>[]>(); // any здесь — компромисс

  addRule<K extends keyof T>(
    field: K,
    rule: ValidationRule<T[K]>
  ): this {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
    return this;
  }

  validate(obj: T): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const [field, rules] of this.rules.entries()) {
      for (const rule of rules) {
        if (!rule.validate(obj[field])) {
          errors.push(rule.message);
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }
}

// Пример:
const userValidator = new Validator<User>()
  .addRule('email', {
    validate: (email) => typeof email === 'string' && email.includes('@'),
    message: 'Invalid email'
  });

const result = userValidator.validate({ id: '1', name: 'M', email: 'bad' });
```

## [↑](#Содержание) Generic-маппер (Entity ↔ DTO)

```ts
interface Mapper<E, D> {
  toEntity(dto: D): E;
  toDto(entity: E): D;
}

class UserMapper implements Mapper<User, UserDto> {
  toEntity(dto: UserDto): User {
    return {
      id: dto.id,
      name: dto.fullName.trim(),
      email: dto.email.toLowerCase()
    };
  }

  toDto(entity: User): UserDto {
    return {
      id: entity.id,
      fullName: entity.name,
      email: entity.email
    };
  }
}
```

> Это помогает чётко разделять слои: база → entity → dto → клиент.
____

# [↑](#Содержание) Conditional types

Conditional types в TypeScript — это мощный механизм метапрограммирования на уровне типов, позволяющий определять типы условно: «если тип A удовлетворяет условию, то верни тип B, иначе — тип C».

Синтаксис напоминает тернарный оператор:

```ts
SomeType extends OtherType ? TrueType : FalseType
```

Они особенно полезны при создании гибких, переиспользуемых утилит, обработке API-ответов, маппинге DTO и работе с дженериками.

## [↑](#Содержание) 🔹 Основы

### [↑](#Содержание) Пример 1: Простой conditional type

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">;   // true
type B = IsString<42>;        // false
type C = IsString<string>;    // boolean (из-за распределительности — см. ниже)
```

> ⚠️ Обрати внимание: если T — обобщённый тип (например, string | number), TypeScript применяет распределительность (distributivity):
> ```ts
> type D = IsString<string | number>; // true | false → boolean
> ```

Чтобы отключить распределительность, оберни в кортеж:

```ts
type IsStringNonDistributive<T> = [T] extends [string] ? true : false;
type E = IsStringNonDistributive<string | number>; // false
```

## [↑](#Содержание) 🔸 Практические use cases в бэкенде
### [↑](#Содержание) Извлечение типа ответа из API-метода

Допустим, у тебя есть обёртка над fetch, которая возвращает { data: T }.

```ts
type ApiResponse<T> = { data: T; status: number };

// Как получить T из ApiResponse<T>?
type UnwrapResponse<R> = R extends ApiResponse<infer U> ? U : never;

type User = { id: string; name: string };
type Response = ApiResponse<User>;

type UserData = UnwrapResponse<Response>; // User
```

> 🔑 Ключевое слово infer — позволяет "захватить" тип внутри условия.

### [↑](#Содержание) Утилита Exclude / Extract (встроенные, но полезно понимать)

```ts
// Exclude<T, U> — исключает из T всё, что assignable к U
type Status = 'pending' | 'success' | 'error';
type NonErrorStatus = Exclude<Status, 'error'>; // 'pending' | 'success'

// Extract<T, U> — наоборот, оставляет только assignable к U
type SuccessOnly = Extract<Status, 'success' | 'done'>; // 'success'
```

Реализация Exclude через conditional type:

```ts
type MyExclude<T, U> = T extends U ? never : T;
```

### [↑](#Содержание) Условное преобразование DTO ↔ Entity

Представь: у тебя есть правило — если поле называется createdAt, оно должно быть Date в entity, но string в DTO.

```ts
type ToEntity<T> = {
  [K in keyof T]: K extends `${string}At` | `${string}Time`
    ? Date
    : T[K];
};

type UserDto = {
  id: string;
  name: string;
  createdAt: string;
};

type UserEntity = ToEntity<UserDto>;
// {
//   id: string;
//   name: string;
//   createdAt: Date;  ← автоматически преобразовано!
// }
```

### [↑](#Содержание) Безопасный обработчик ошибок с conditional types

```ts
type SafeResult<T> = 
  | { ok: true;  T }
  | { ok: false; error: string };

// Получить тип данных, если результат успешен
type GetData<T> = T extends SafeResult<infer D> ? D : never;

function handleResult<T>(result: T): GetData<T> | null {
  if ((result as any).ok) {
    return (result as any).data;
  }
  return null;
}
```

### [↑](#Содержание) Условные middleware-типы (NestJS / Express)

Допустим, middleware может возвращать либо void, либо Promise<void>. Ты хочешь нормализовать это:

```ts
type NormalizeMiddleware<T> = T extends (...args: any[]) => infer R
  ? R extends Promise<any> ? R : Promise<R>
  : never;

// Теперь любой обработчик приводится к Promise<void>
```

## [↑](#Содержание) 🔹 Распространённые встроенные conditional types

### [↑](#Содержание) Распространённые встроенные conditional types в TypeScript


| Утилита           | Описание                                                                 | Пример использования                                     |
|-------------------|--------------------------------------------------------------------------|----------------------------------------------------------|
| `Exclude<T, U>`   | Исключает из `T` все типы, совместимые с `U`                             | `Exclude<'a' \| 'b' \| 'c', 'b'>` → `'a' \| 'c'`        |
| `Extract<T, U>`   | Извлекает из `T` только те типы, которые совместимы с `U`                | `Extract<'a' \| 'b' \| 'c', 'b' \| 'd'>` → `'b'`        |
| `NonNullable<T>`  | Удаляет `null` и `undefined` из типа                                     | `NonNullable<string \| null>` → `string`                |
| `ReturnType<T>`   | Получает тип возвращаемого значения функции                              | `ReturnType<() => number>` → `number`                   |
| `Parameters<T>`   | Получает кортеж типов параметров функции                                 | `Parameters<(x: number, y: string) => void>` → `[number, string]` |
| `ConstructorParameters<T>` | Получает кортеж типов параметров конструктора класса             | `ConstructorParameters<typeof Date>` → `[string \| number \| ...]` |
| `InstanceType<T>` | Получает тип экземпляра класса                                           | `InstanceType<typeof MyClass>` → `MyClass`              |
| `Awaited<T>`      | Рекурсивно раскрывает промисы (начиная с TypeScript 4.5)                 | `Awaited<Promise<Promise<string>>>` → `string`          |


Пример ReturnType:

```ts
function getUser(id: string) {
  return { id, name: "Мурад" };
}

type User = ReturnType<typeof getUser>; // { id: string; name: string }
```


### [↑](#Содержание) 💡 Совет для бэкенд-разработчика

Conditional types особенно полезны, когда ты:

- Пишешь универсальные библиотеки (например, ORM-адаптеры)
- Делаешь строгую типизацию API-слоя
- Хочешь автоматически выводить типы из структуры запросов/ответов
- Готовишься к Spring Boot: многие паттерны (Optional<T>, ResponseEntity<T>) имеют аналоги через conditional types

# [↑](#Содержание) Decorators

Decorators в TypeScript — это особый синтаксис для аннотирования и модификации классов, методов, свойств, геттеров/сеттеров и параметров во время определения. Они позволяют добавлять метаданные или изменять поведение без изменения исходного кода — идеально подходят для бэкенда (например, маршрутизация, авторизация, логирование, валидация).
____

> ⚠️ Важно: Декораторы в TypeScript — экспериментальная функция. Чтобы использовать их, нужно включить в tsconfig.json:
> 
> ```json
> {
>   "compilerOptions": {
>     "experimentalDecorators": true,
>     "emitDecoratorMetadata": true
>   }
> }
> ```

## [↑](#Содержание) 🔹 Синтаксис

Декоратор — это просто функция, которая вызывается с определёнными аргументами в зависимости от того, к чему она применяется:

```ts
@decorator
class MyClass { }

@methodDecorator
method() { }

@propertyDecorator
prop: string;

@parameterDecorator
method(@paramDecorator param: string) { }
```

## [↑](#Содержание) 🔸 Типы декораторов
### [↑](#Содержание) Декоратор класса

```ts
function LogClass<T extends new (...args: any[]) => {}>(constructor: T) {
  console.log(`Класс ${constructor.name} создан`);
  return class extends constructor {
    // можно даже расширить поведение
  };
}

@LogClass
class UserService {
  constructor() {
    console.log("Инициализация UserService");
  }
}
// При запуске: "Класс UserService создан"
```

### [↑](#Содержание) Декоратор метода

```ts
function LogMethod(
  target: Object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`Вызов ${String(propertyKey)} с аргументами:`, args);
    return originalMethod.apply(this, args);
  };
}

class MathService {
  @LogMethod
  add(a: number, b: number): number {
    return a + b;
  }
}

new MathService().add(2, 3); 
// → "Вызов add с аргументами: [2, 3]"
```

### [↑](#Содержание) Декоратор свойства

```ts
function MinLength(length: number) {
  return function (target: Object, propertyKey: string) {
    let value: string;
    const getter = () => value;
    const setter = (newVal: string) => {
      if (newVal.length < length) {
        throw new Error(`${propertyKey} должен быть не короче ${length} символов`);
      }
      value = newVal;
    };
    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  };
}

class User {
  @MinLength(3)
  name: string = "";
}
```

### [↑](#Содержание) Декоратор параметра

Часто используется вместе с reflect-metadata для внедрения зависимостей или валидации.

```ts
import "reflect-metadata";

const PARAM_TYPES = Symbol("paramTypes");

function ValidateParam(
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number
) {
  const existing = Reflect.getOwnMetadata(PARAM_TYPES, target, propertyKey) || [];
  existing[parameterIndex] = "string"; // или другая метка
  Reflect.defineMetadata(PARAM_TYPES, existing, target, propertyKey);
}

class AuthController {
  login(@ValidateParam email: string, password: string) {
    // можно проверить типы через Reflect.getMetadata
  }
}
```

> Для этого требуется npm install reflect-metadata и импорт в точке входа.

## [↑](#Содержание) 🔥 Практическое применение в бэкенде
### [↑](#Содержание) ✅ NestJS (аналог Spring Boot для Node.js)

NestJS активно использует декораторы — почти как в Java/Spring:

```ts
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  @HttpCode(200)
  findOne(@Param('id') id: string): User {
    return this.usersService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

- @Controller, @Get, @Post — маршрутизация  
- @Body(), @Param() — извлечение данных  
- @UseGuards() — middleware/авторизация  
- @Injectable() — внедрение зависимостей

> Это прямой аналог @RestController, @GetMapping, @RequestBody в Spring Boot.

### [↑](#Содержание) ✅ Валидация DTO (с class-validator)

```ts
import { IsEmail, MinLength } from "class-validator";

class CreateUserDto {
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;
}

// Затем валидируешь:
const errors = await validate(dto);
```

### [↑](#Содержание) ✅ Логирование, кэширование, метрики

```ts
@Cacheable({ ttl: 60 })
async getUser(id: string): Promise<User> {
  return db.users.findById(id);
}

@MeasureTime()
async processPayment(data: PaymentData) {
  // ...
}
```

### [↑](#Содержание) ⚠ Ограничения

- Декораторы не работают с обычными функциями (только с классами и их членами).
- Без reflect-metadata сложно получать типы параметров во время выполнения.
- Изменение поведения метода требует осторожности (сохраняй this, обрабатывай async).