# EthosHub · Frontend

Plataforma que conecta a profesionales con empresas y reclutadores mediante perfiles,
portafolios públicos y chat. Proyecto de **Taller de Ingeniería de Software** de la Universidad
Mayor de San Simón (UMSS), semestre I/2026.

Este repositorio contiene el frontend web.

## Mi parte: la base de datos

Modelé la base de datos **PostgreSQL** de EthosHub y la desplegué, primero en **Supabase** y
después en los **servidores de la UMSS**.

Desde el frontend, la base se usa de tres maneras:

- **19 funciones de PostgreSQL invocadas por RPC** (`supabase.rpc`):

  | Módulo | Funciones |
  |---|---|
  | Chat | `upsert_chat`, `get_chat_list`, `get_professional_chat_list`, `get_messages`, `get_last_message`, `delete_message`, `delete_chat`, `mark_messages_read`, `get_unread_count` |
  | Indicador de «escribiendo» | `upsert_typing`, `clear_typing` |
  | «Me gusta» y vistas | `add_like`, `remove_like`, `get_profile_likes_count`, `get_talent_views_count`, `get_company_likes`, `get_company_likes_full` |
  | Empresas | `get_company_profile`, `get_company_chats_count` |

- **Tiempo real:** suscripciones a los cambios (`postgres_changes`) de `chat_messages` y
  `chat_typing` para los mensajes y el indicador de «escribiendo».
- **Almacenamiento:** archivos adjuntos del chat en el bucket `attachments`.

## Funcionalidades

- **Profesionales:** perfil, experiencia, educación, habilidades, proyectos, portafolio público
  (se puede proteger con contraseña y exportar a PDF), estudio de CV y chat.
- **Reclutadores:** búsqueda de talento, «me gusta» a perfiles, panel y chat con profesionales.
- **Administración:** panel general, moderación, perfiles, catálogo de habilidades y correo.
- Autenticación con correo y verificación OTP, u OAuth; interfaz en español, inglés y portugués (i18next).

## Tecnologías

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Router · Supabase JS ·
Recharts · Leaflet · Vitest

## Ejecución

```bash
npm install
npm run dev
```

Las variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_API_URL` se definen en un
archivo `.env`.
