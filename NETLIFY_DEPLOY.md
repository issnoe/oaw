# Despliegue en Netlify

Esta aplicación Angular con SSR está configurada para desplegarse en Netlify.

## Configuración

Los siguientes archivos han sido creados/configurados:

1. **netlify.toml** - Configuración principal de Netlify con el plugin `@netlify/angular-runtime`
2. **src/server.ts** - Servidor compatible con Netlify que maneja SSR y el endpoint `/api/home-content`
3. **package.json** - Incluye `@netlify/angular-runtime` como dependencia de desarrollo

**Nota**: El plugin `@netlify/angular-runtime` maneja automáticamente el SSR de Angular. El archivo `server.ts` está configurado en el formato compatible con Netlify e incluye el endpoint `/api/home-content` para el proxy de contenido externo.

## Pasos para desplegar

### Opción 1: Desde la CLI de Netlify

1. Instala Netlify CLI globalmente:
```bash
npm i -g netlify-cli
```

2. Inicia sesión en Netlify:
```bash
netlify login
```

3. Inicializa el proyecto (solo la primera vez):
```bash
netlify init
```

4. Despliega el proyecto:
```bash
netlify deploy
```

5. Para producción:
```bash
netlify deploy --prod
```

### Opción 2: Desde GitHub (Recomendado)

1. Sube tu código a GitHub
2. Ve a [app.netlify.com](https://app.netlify.com)
3. Haz clic en "Add new site" > "Import an existing project"
4. Conecta tu repositorio de GitHub
5. Netlify detectará automáticamente la configuración desde `netlify.toml`
6. El despliegue se realizará automáticamente en cada push

## Configuración del Build

- **Build command**: `npm run build`
- **Publish directory**: `dist/oaw/browser`
- **Node version**: 20.x

## Endpoints

### `/api/home-content`
Endpoint proxy integrado en `server.ts` que obtiene el contenido externo, evitando problemas de CORS. Este endpoint está manejado directamente por el handler de Angular SSR.

### `/*` (Todas las rutas)
El plugin `@netlify/angular-runtime` maneja automáticamente el SSR de Angular para todas las rutas de la aplicación usando el handler definido en `server.ts`.

## Variables de Entorno

Si necesitas configurar variables de entorno, puedes hacerlo desde el dashboard de Netlify o usando:

```bash
netlify env:set VARIABLE_NAME value
```

## Notas

- El build se ejecuta automáticamente con `npm run build`
- Los archivos estáticos se sirven desde `dist/oaw/browser`
- El SSR se maneja automáticamente por el plugin `@netlify/angular-runtime`
- El endpoint `/api/home-content` está integrado en `server.ts` y se maneja junto con el SSR
- Asegúrate de instalar las dependencias: `npm install` (esto instalará `@netlify/angular-runtime`)
- El archivo `server.ts` está configurado en el formato compatible con Netlify usando `AngularAppEngine` y `getContext` de `@netlify/angular-runtime`

## Solución de Problemas

Si encuentras problemas con el despliegue:

1. Verifica que Node.js 20 esté configurado en Netlify
2. Asegúrate de que todas las dependencias estén en `package.json`
3. Revisa los logs de build en el dashboard de Netlify
4. Verifica que los paths en `netlify.toml` sean correctos
