# Test Strategy – Liverpool Playwright Automation

## 1. Alcance de automatización

El flujo automatizado cubre la búsqueda de "PlayStation 5", filtrado por color "Blanco", ordenamiento por precio de menor a mayor y validación de los primeros cinco resultados. Adicionalmente, se valida la información mostrada en UI contra la respuesta de red consumida por el frontend.
No automatizaría elementos que dependan de intervención humana real, como CAPTCHA, validaciones visuales subjetivas, comportamiento de accesibilidad que requiera evaluación humana o pruebas exploratorias. Estos escenarios requieren criterio humano y pueden complementar la automatización mediante pruebas manuales especializadas.

## 2. ¿Qué NO automatizaría, y por qué?

- **Validación visual/estética del layout** (alineación de tarjetas, espaciado, tipografía). Un cambio de CSS legítimo rompería el test sin que exista un bug real. Esto lo dejaría para revisión visual manual o, como mucho, un snapshot testing puntual y de bajo mantenimiento.
- El WAF/anti-bot en sí mismo: no tiene sentido "probar" que el WAF bloquea headless — es infraestructura de terceros (Akamai/similar) fuera de nuestro control. Lo que sí automatizo es **cómo mi suite reacciona** ante ese bloqueo (retry, fallback a headed, o marcar el test como skip con alerta).

Si Liverpool incorporara un CAPTCHA, no intentaría resolverlo ni automatizarlo mediante técnicas de bypass, ya que esto generaría una prueba frágil y no representaría el comportamiento esperado de un usuario. Eso viola ToS y es frágil por diseño. Estrategia real:
1.Aislar el CAPTCHA como punto de fallo esperado**: el test detecta el selector/iframe del CAPTCHA y lo reporta como "bloqueado por CAPTCHA", no como fallo genérico, para no contaminar métricas de calidad del producto con problemas de infraestructura anti-bot.
2.Usuarios de prueba whitelisteados**: solicitar al equipo de plataforma una IP/user-agent en allowlist para el entorno de CI, común en empresas con WAF agresivo.
3.Si nada de eso es posible, ese tramo del flujo pasa a **prueba manual exploratoria** documentada, no a automatización forzada.

## 3. Riesgos de Flakiness y mitigaciones

Los principales riesgos son cambios en selectores o estructura del DOM, tiempos variables de carga, respuestas lentas de API, contenido dinámico, disponibilidad variable de productos, filtros que dependen de llamadas asíncronas y diferencias entre ambientes.

Para mitigarlos utilizo localizadores robustos de Playwright como `getByRole` y `getByTestId`, esperas basadas en eventos reales en lugar de `waitForTimeout`, `waitForResponse` para sincronización con API, configuración de screenshots automáticos en fallos, trazas para diagnóstico, además de reintentos controlados únicamente en CI.

Riesgo Mitigación aplicada
Bloqueo 403 en headless (WAF) , Ejecutar con `headless: false` en CI o usar `--disable-blink-features=AutomationControlled`; fallback documentado,`strict mode violation` en locators, Uso de `data-testid` y `getByRole` con nombres exactos en vez de selectores CSS genéricos; verificados vía `codegen`

## 4. Integración en una CI con más de 50 suites

No ejecutaría todas las suites completas en cada cambio. Implementaría una estrategia por capas:
* Smoke tests en cada Pull Request.
* Regresión completa mediante ejecución programada o sobre cambios relevantes.
* Ejecución paralela mediante workers/sharding de Playwright.
* Etiquetado de pruebas por prioridad (`smoke`, `regression`, `critical`).
* Reutilización de configuración y fixtures comunes.
* Alertas diferenciadas: un fallo por WAF/CAPTCHA no debe generar la misma alerta que un fallo de aserción de negocio (precio incorrecto, producto faltante)

El objetivo sería mantener feedback rápido en Pull Requests sin sacrificar la cobertura de regresión. 
