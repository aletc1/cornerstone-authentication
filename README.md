# @cornerstone/authentication

`@cornerstone/authentication` provides an easy way to authenticate in multiple isolated micro frontends (iframes). It supports ADAL and OpenID Connect.

> **Important for ES5**: You will need a Polyfill for [Function.name](https://www.npmjs.com/package/function.name) in order to make it work on Internet Explorer).

## Main goals
- TODO

### Why a new communication library?
- TODO

## Getting started

To install just use the following npm command:
```
npm install @cornerstone/authentication --save
```
It is very important that you enable experimental decorators and emit metadata in typescript `tsconfig.json`. Example:
```javascript
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es5",
    "outDir": "lib",
    "moduleResolution": "node",
    "jsx": "react",
    "lib": [ "es6", "dom" ],
    "sourceMap": false,
    "inlineSourceMap": true,
    "declaration": true,
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
Finally, dont forget to include reflect metadata package on your bootstrap code:
```typescript
import 'reflect-metadata';
``` 

## License

This solution is licensed under GPLv3. If you need commercial support or other licensing terms, contact the author.