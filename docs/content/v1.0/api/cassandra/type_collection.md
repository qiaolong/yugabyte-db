---
title: MAP, SET, LIST
summary: MAP, SET and LIST types
description: Collection Types
menu:
  v1.0:
    parent: api-cassandra
    weight: 1390
---

## Synopsis

Collection datatypes are used to specify columns for data objects that can contains more than one value.

### LIST
`LIST` is an ordered collection of elements. All elements in a `LIST` must be of the same primitive type. Elements can be prepend or append by `+` operator to a list, removed by `-` operator, and referenced by their indexes of that list by `[]` operator.

### MAP
`MAP` is an sorted collection of pairs of elements, a key and a value. The sorting order is based on the key values and is implementation-dependent. With their key values, elements in a `MAP` can be set by the `[]` operator, added by the `+` operator, and removed by the `-` operator.
When queries, the element pairs of a map willl be returned in the sorting order.

### SET
`SET` is a sorted collection of elements. The sorting order is implementation-dependent. Elements can be added by `+` operator and removed by `-` operator. When queried, the elements of a set will be returned in the sorting order.

## Syntax
```
type_specification ::= { LIST<type> | MAP<key_type:type> | SET<key_type> }

list_literal ::= '[' [ expression ...] ']'

map_literal ::= '{' [ { expression ':' expression } ...] '}'

set_literal ::= '{' [ expression ...] '}'

```

Where 

- Columns of type `LIST`, 'MAP', or `SET` cannot be part of the `PRIMARY KEY`.
- `type` must be a [non-parametric datatype](../#datatypes) or a [frozen](../type_frozen) datatype.
- `key_type` must be any datatype that is allowed in a primary key (Currently `FROZEN` and all non-parametric datatypes except `BOOL`).
- For `map_literal` the left-side `expression` represents the key and the right-side one represents the value.
- `expression` is any well formed CQL expresssion. See [Expression](..#expressions) for more information on syntax rules.

## Semantics

- Type parameters must be simple types or [frozen types](../type_frozen) (collections and user-defined types must be frozen to be used as collection parameters).
- Columns of type `LIST`, `MAP`, and `SET` cannot be part of the `PRIMARY KEY`.
- Implicitly, values of collection datatypes are neither convertible nor comparable to other datatypes.
- Each expression in a collection literal must evaluate to a value convertible to the corresponding parameter datatype.
- Comparisons on collection values are not allowed (e.g. in `WHERE` or `IF` clauses).
- Empty collections are treated as null values.

{{< note title="Note" >}}
Collections are designed for storing small sets of values that are not expected to grow to arbitrary size (such as phone numbers or addresses for a user rather than posts or messages).
While collections of larger sizes are allowed, they may have a significant impact on performance for queries involving them. 
In particular, some list operations (insert at an index and remove elements) require a read-before-write.
{{< /note >}}

## Examples

### `CREATE TABLE` with Collections.
- Collection types are used like simple types (except they are not allowed in primary key).

You can do this as shown below.

```sql
cqlsh:example> CREATE TABLE users(username TEXT PRIMARY KEY, 
                                  emails SET<TEXT>,
                                  phones MAP<TEXT,TEXT>,
                                  top_cities LIST<TEXT>);
```

### `INSERT` Collection Data.
- Collection values are inserted by setting all their elements at once.

You can do this as shown below.

```sql
cqlsh:example> INSERT INTO users(username, emails, phones, top_cities) 
               VALUES ('foo', 
                       {'c@example.com', 'a@example.com'}, 
                       {'home' : '999-9999', 'mobile' : '000-0000'}, 
                       ['New York', 'Paris']);
```

Empty collections are the same as nulls.

```sql
cqlsh:example> INSERT INTO users(username, emails, phones, top_cities) VALUES ('bar', { }, { }, [ ]);
```


```sql
cqlsh:example> SELECT * FROM users;
```

```
 username | emails                             | phones                                     | top_cities
----------+------------------------------------+--------------------------------------------+-----------------------
      bar |                               null |                                       null |                  null
      foo | {'a@example.com', 'c@example.com'} | {'home': '999-9999', 'mobile': '000-0000'} | ['New York', 'Paris']
```

### `UPDATE` Collection Column.

- Collection values can be updated by setting all their elements at once.

You can do this as shown below.

```sql
cqlsh:example> UPDATE users SET emails = {'bar@example.com'} WHERE username = 'bar';
```


```sql
cqlsh:example> UPDATE users SET phones = {'home' : '123-45678'} WHERE username = 'bar';
```

```sql
cqlsh:example> UPDATE users SET top_cities = ['London', 'Tokyo'] WHERE username = 'bar';
```

```sql
cqlsh:example> SELECT * FROM users;
```
```
 username | emails                             | phones                                     | top_cities
----------+------------------------------------+--------------------------------------------+-----------------------
      bar |                {'bar@example.com'} |                      {'home': '123-45678'} |   ['London', 'Tokyo']
      foo | {'a@example.com', 'c@example.com'} | {'home': '999-9999', 'mobile': '000-0000'} | ['New York', 'Paris']
```

### Collection Expressions
- Collection elements can be added with `+` or removed with `-`.

You can do this as shown below.

```sql
cqlsh:example> UPDATE users SET emails = emails + {'foo@example.com'} WHERE username = 'foo';
```

```sql
cqlsh:example> UPDATE users SET emails = emails - {'a@example.com', 'c.example.com'} WHERE username = 'foo';
```

```sql
cqlsh:example> UPDATE users SET phones = phones + {'office' : '333-3333'} WHERE username = 'foo';
```

```sql
cqlsh:example> SELECT * FROM users;
```

```
 username | emails                               | phones                                                           | top_cities
----------+--------------------------------------+------------------------------------------------------------------+-----------------------
      bar |                  {'bar@example.com'} |                                            {'home': '123-45678'} |   ['London', 'Tokyo']
      foo | {'c@example.com', 'foo@example.com'} | {'home': '999-9999', 'mobile': '000-0000', 'office': '333-3333'} | ['New York', 'Paris']
```

- To remove map elements only the relevant keys need to be given (as a set).

You can do this as shown below.

```sql
cqlsh:example> UPDATE users SET phones = phones - {'home'} WHERE username = 'foo';
```

```sql
cqlsh:example> SELECT * FROM users;
```

```
 username | emails                               | phones                                       | top_cities
----------+--------------------------------------+----------------------------------------------+-----------------------
      bar |                  {'bar@example.com'} |                        {'home': '123-45678'} |   ['London', 'Tokyo']
      foo | {'c@example.com', 'foo@example.com'} | {'mobile': '000-0000', 'office': '333-3333'} | ['New York', 'Paris']
```

- List elements can be either prepended or appended. 

You can do this as shown below.

```sql
cqlsh:example> UPDATE users SET top_cities = top_cities + ['Delhi'] WHERE username = 'foo';
```

```sql
cqlsh:example> UPDATE users SET top_cities = ['Sunnyvale'] + top_cities WHERE username = 'foo';
```

```sql
cqlsh:example> UPDATE users SET top_cities = top_cities - ['Paris', 'New York'] WHERE username = 'foo';
```

```sql
cqlsh:example> SELECT * FROM users;
```

```
 username | emails              | phones                                       | top_cities
----------+---------------------+----------------------------------------------+------------------------
      bar | {'bar@example.com'} |                        {'home': '123-45678'} |    ['London', 'Tokyo']
      foo | {'foo@example.com'} | {'mobile': '000-0000', 'office': '333-3333'} | ['Sunnyvale', 'Delhi']
```

### `UPDATE` Map and List Elements

- Maps allow referencing elements by key.

You can do this as shown below.

```sql
cqlsh:example> UPDATE users SET phones['mobile'] = '111-1111' WHERE username = 'foo';
```

```sql
cqlsh:example> UPDATE users SET phones['mobile'] = '345-6789' WHERE username = 'bar' IF phones['mobile'] = null;
```

```sql
cqlsh:example> SELECT * FROM users;
```

```
 username | emails                               | phones                                       | top_cities
----------+--------------------------------------+----------------------------------------------+-----------------------
      bar |                  {'bar@example.com'} |  {'home': '123-45678', 'mobile': '345-6789'} |   ['London', 'Tokyo']
      foo | {'c@example.com', 'foo@example.com'} | {'mobile': '111-1111', 'office': '333-3333'} | ['New York', 'Paris']
```

- Lists allow referencing elements by index (numbering starts from 0).

You can do this as shown below.

```sql
cqlsh:example> UPDATE users SET top_cities[0] = 'San Francisco' WHERE username = 'bar';
```

```sql
cqlsh:example> UPDATE users SET top_cities[1] = 'Mumbai' WHERE username = 'bar' IF top_cities[1] = 'Tokyo';
```

```sql
cqlsh:example> SELECT * FROM users;
```

```
 username | emails                               | phones                                       | top_cities
----------+--------------------------------------+----------------------------------------------+-----------------------------
      bar |                  {'bar@example.com'} |  {'home': '123-45678', 'mobile': '345-6789'} | ['San Francisco', 'Mumbai']
      foo | {'c@example.com', 'foo@example.com'} | {'mobile': '111-1111', 'office': '333-3333'} |       ['New York', 'Paris']
```

## See Also

[Data Types](..#datatypes)
