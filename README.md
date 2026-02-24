# BDB Kata — Legacy Modern App

> Para este reto técnico se propone un Motor de modernización de codigo Legacy basado en Blu Age: Se establece un motor de modernización de código COBOL a Java / Spring Boot sobre AWS.

## Los 3 Pilares del Motor Son

### 1. Retro-Ingeniería — Fase de Análisis

Blu Age "lee" el código legacy para extraer el modelo de datos y la lógica de control.

| Blu Age | Nuestro motor |
|---|---|
| Analiza COBOL, JCL y CICS para entender dependencias | `extractClassName` + escaneo de `WORKING-STORAGE SECTION` |
| Identifica estructuras de datos y control | Detecta campos `PIC 9` / `PIC X` para inferir tipos Java |

### 2. Transformación — Fase de Generación de Código

Blu Age traduce la sintaxis COBOL a patrones de diseño modernos (Java, Spring Boot, Angular).

| Blu Age | Nuestro motor |
|---|---|
| Convierte procesos batch → servicios Java | `StringBuilder` como motor de plantillas estilo Velocity |
| Pantallas 3270 → interfaces web | POJOs con tipos inteligentes (`LocalDate`, `BigDecimal`) |
| | Lógica `MOVE`, `COMPUTE`, `DISPLAY` → código Java en `executeLegacyLogic()` |

### 3. Ingeniería Directa — Fase de Despliegue

Una vez generado el código, Blu Age lo empaqueta para correr en la nube.

| Blu Age | Nuestro motor |
|---|---|
| Genera `.war` / `.jar` listos para Application Server | Persistencia real en S3 bajo `MODERN_CODE/` |
| Despliegue en AWS Mainframe Modernization (M2) | Simulación del artefacto final + ejecución vía Lambda |

> **⚠ Nota Técnica — Restricciones de cuenta AWS y estrategia de ejecución alternativa**
>
> AWS Mainframe Modernization (M2) requiere permisos de cuenta avanzados (`m2:CreateApplication`, `m2:StartApplication`, roles de servicio específicos) que no siempre están disponibles en cuentas de laboratorio o entornos restringidos.
>
> Para este reto técnico, se adoptó la siguiente **estrategia alternativa de ejecución** que mantiene el mismo flujo conceptual sin depender de M2:

#### Incluir el metodo `main` en el codigo Java generado

En un despliegue M2 real, el código modernizado vive dentro de un *Application Server* que gestiona el ciclo de vida. Al no tener acceso a M2, el motor genera un método `main(String[] args)` que:

1. Instancia la clase POJO generada.
2. Invoca `executeLegacyLogic()` con la lógica de negocio traducida.
3. Escribe la salida por `System.out.println` para que pueda ser capturada.

Esto hace el artefacto **completamente standalone**: no necesita servidor de aplicaciones, contenedor ni framework externo para ejecutarse.

#### Flujo de compilación y ejecución (`/execute-application`)

```
S3 (MODERN_CODE/*.java)
        │  1. Descarga el .java
        ▼
 Backend EC2 — directorio temporal
        │  2. javac MiClase.java  →  genera MiClase.class
        ▼
 Runtime.exec("java MiClase")
        │  3. Captura stdout línea a línea
        ▼
 Response: List<String> metaDatosCobol
        │  4. Limpia archivos temporales
        ▼
            Frontend renderiza logs en terminal
```

## Reglas de Transformación

Para el motor planteado en este proyecto, cuando encuentra algo que sabe traducir al 100 %, lo registra como `appliedRule`; cuando algo es ambiguo, genera un `warning` para revisión humana, teniendo en cuenta lo anterior se definen las siguientes reglas:

### Reglas de Datos (WORKING-STORAGE SECTION)

| # | Regla | Patrón COBOL | Resultado Java | Por qué importa |
|---|---|---|---|---|
| 1 | **Conversión de Fechas** | Campo con `FECHA` + `9(6)` o `9(8)` | `java.time.LocalDate` | Habilita cálculos de fechas modernos; en COBOL las fechas son solo números |
| 2 | **Precisión Decimal** | Cláusula `V` en `PIC` (ej. `9(07)V99`) | `java.math.BigDecimal` | Evita errores de redondeo en `Double`/`Float`; crítico en sistemas financieros |
| 3 | **Filtrado de Redundantes** | Palabra clave `FILLER` | *(ignorado)* | El código Java queda limpio, sin basura técnica sin valor de negocio |
| 4 | **Estandarización de Nombres** | `WS-SALDO-FINAL` (Kebab-Case) | `saldoFinal` / `ProcesoDescuento` | Cumple Java Naming Conventions; legible para cualquier desarrollador |
| 5 | **Tipado Inteligente** | `PIC 9` / `PIC X` | `Integer` / `String` | Evita que todo sea `String`; el compilador detecta errores de lógica antes de ejecutar |

### Reglas de Lógica (PROCEDURE DIVISION)

| # | Regla | Comando COBOL | Traducción Java |
|---|---|---|---|
| 6 | **MOVE** | `MOVE A TO B` | `this.b = a;` |
| 7 | **COMPUTE** | `COMPUTE C = A + B` | `this.c = this.a.add(this.b);` |
| 8 | **DISPLAY** | `DISPLAY "Mensaje"` | `System.out.println("Mensaje");` |

---

## Arquitectura AWS Propuesta

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React App  │────▶│  Spring Boot API ────▶│  AWS S3             │
│ AWS Amplify │     │  AWS EC2         │     │  LEGACY_CODE/       │
└─────────────┘     │                  │     │  MODERN_CODE/       │
                    │  Endpoints:      │     └─────────────────────┘
                    │  /presigned-url  │
                    │  /full-pipeline  │     ┌─────────────────────┐
                    │  /execute-app    │────▶  AWS Lambda Worker   │
                    └──────────────────┘     │  - Descarga .java   │
                                             │  - Compila y ejecuta│
                                             │  - Retorna logs     │
                                             └─────────────────────┘
```

### Componentes

| Capa | Servicio AWS | Beneficio |
|---|---|---|
| **Frontend** | AWS Amplify (React) | Distribución global, HTTPS automático, CI/CD integrado |
| **Backend API** | AWS EC2 (Spring Boot) | Escalado, aislamiento, sin riesgo de ejecutar código arbitrario en el API |
| **Ejecución** | AWS Lambda | Aislamiento, seguridad, pago por uso, fácil escalado |
| **Almacenamiento** | AWS S3 | Versionado, cifrado en reposo (SSE-S3/KMS), control con IAM |
| **Seguridad** | IAM Roles | Backend solo genera presigned URLs; Lambda solo accede a su bucket |
| **Observabilidad** | CloudWatch Logs | Captura de ejecución de Lambda y backend en tiempo real |

### Flujo de Seguridad

- **IAM**: el backend solo puede generar presigned URLs; el Lambda solo lee/escribe en el bucket específico.

## Stack Tecnológico del Frontend

| Tecnología | Uso |
|---|---|
| React 18 + TypeScript | UI principal |
| Vite | Bundler y dev server |
| AWS Amplify (objetivo) | Despliegue en producción |

## Endpoints del Backend

| Endpoint | Descripción | Response relevante |
|---|---|---|
| `GET /api/presigned-url` | Genera URL firmada para subir el archivo a S3 | `url` |
| `POST /api/modernization/full-pipeline` | Ejecuta el pipeline completo de modernización | `logs`, `appliedRules`, `warnings`, `targetKey` |
| `GET /api/modernization/execute-application` | Ejecuta el código Java modernizado | `metaDatosCobol --> logs de Ejecución` |
