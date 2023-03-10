# Krestianstvo | S.js 

Krestianstvo | S.js - is the prototype of the **[Croquet Application Architecture](https://croquet.io)** in functional reactive paradigm, based on **[S.js](https://github.com/adamhaile/S)**. It uses just signals and reactive computations. It's Virtual Time and Reflector are based on **[Virtual World Framework's](https://github.com/virtual-world-framework/vwf)** implementation.
This prototype is the part of the biggest **[Krestianstvo | Solid JS](https://github.com/NikolaySuslov/krestianstvo)**, which is more feature completed and can be distributed as a standalone ESM library.

## Live Demo

**https://www.krestianstvo.org/s** 


## Develop 

**Run Krestianstvo | S.js**

```js
git clone https://github.com/NikolaySuslov/krestianstvo-s.js
npm install
npm run dev  
```

By default Vite will start the development server: `http://localhost:5173`   
Copy this link to the Web browser

**Run local Reflector server or connect to the public one**

Public running reflector: **https://time.krestianstvo.org**

Run your local Reflector 

```js
git clone https://github.com/NikolaySuslov/lcs-reflector 
npm install  
npm run start 
```

By default Reflector server will start at: http://localhost:3001  


## Build and deploy

The project is using Vite

```js
npm run build
npm run serve
```

## Contributing

All code is published under the MIT license
