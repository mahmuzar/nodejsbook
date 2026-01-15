## Содержание
- [Generics](#generics)
    - [Generics особенно полезны при проектировании](#-Generics-особенно-полезны-при-проектировании)
    - [Generic-репозиторий (аналог Spring Data Repository)](#--Generic-репозиторий-аналог-Spring-Data-Repository)
    - [🔄 Generic API-клиент для внешних сервисов](#--Generic-API-клиент-для-внешних-сервисов)
    - [⚙️ Generic-сервис с обработкой ошибок](#--Generic-сервис-с-обработкой-ошибок)
    - [DTO с валидацией через generics](#-DTO-с-валидацией-через-generics)
    - [Generic-маппер (Entity ↔ DTO)](#-Generic-маппер-Entity--DTO)
- [Conditional](#Conditional)
- [Types](#Types)
- [Decorators](#Decorators)

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

```ts-
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

## [↑](#Содержание) ⚙️ Generic-сервис с обработкой ошибок

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

# Conditional
# Types
# Decorators