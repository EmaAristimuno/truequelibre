# TruequeLibre — Reglas de negocio y funcionamiento

Documento de referencia para entender qué hace la plataforma, cómo funciona cada parte, y qué rol cumple cada tipo de usuario. Se irá actualizando a medida que se agreguen funcionalidades.

**Última actualización:** 2026-08-25

---

## 1. Qué es TruequeLibre

Plataforma web para intercambiar objetos directamente entre personas, **sin que intervenga dinero**. La propuesta de valor central es combatir el consumismo dándole una segunda vida a objetos que ya no se usan, a través de:

- Un feed público donde cualquiera puede ver qué objetos hay disponibles para intercambiar.
- Un **algoritmo de matching automático** que no solo cruza a dos personas que se quieren intercambiar objetos entre sí, sino que también detecta **cadenas de trueque de 3 o más personas** (ej: A le da su objeto a B, B le da el suyo a C, y C le da el suyo a A — un trueque en círculo donde todos terminan con algo que querían, aunque nadie tenía directamente lo que el otro buscaba).

---

## 2. Roles de usuario

### 2.1 Visitante (no registrado)
- Puede ver la landing page, el feed de objetos disponibles, buscar y filtrar por categoría.
- **No puede** publicar objetos, proponer trueques, ni acceder al chat o su perfil.
- Al intentar publicar o acceder a una sección privada, se lo redirige a iniciar sesión.

### 2.2 Usuario registrado
- Se registra con email y contraseña; recibe un correo de confirmación antes de poder operar.
- Puede:
  - Publicar objetos (con fotos, categoría, condición, y qué categorías acepta a cambio).
  - Ver y gestionar sus propias publicaciones desde su perfil.
  - Recibir propuestas de trueque automáticas generadas por el algoritmo.
  - Aceptar un trueque propuesto.
  - Chatear con las otras partes de un trueque una vez que existe la propuesta.
  - Ver su historial de trueques.
- Cada usuario tiene un **perfil público básico**: nombre de usuario, ubicación, calificación (actualmente sin uso activo, ver sección 7).

### 2.3 Administrador
- **Todavía no existe como rol dentro de la aplicación.** Hoy la única forma de operar a nivel administrativo es a través del panel de Supabase (base de datos) directamente, fuera de la interfaz de usuario. Queda pendiente definir si se necesita un panel de administración (moderación de publicaciones, resolución de disputas, gestión de usuarios).

---

## 3. Publicar un objeto

Cualquier usuario registrado puede publicar un objeto con:

- **Título y descripción.**
- **Categoría** (Bicicletas, Tecnología, Ropa, Música, Hogar, Libros, Deportes).
- **Condición**: Nuevo / Como nuevo / Usado / Para repuestos.
- **Hasta 4 fotos** (opcional, máx. 5MB cada una), almacenadas de forma privada por usuario pero visibles públicamente una vez publicadas.
- **Qué categorías acepta a cambio** (una o más) — esto es lo que alimenta al algoritmo de matching.
- Una descripción libre opcional de lo que busca a cambio.

Al publicar, el objeto queda con estado **Disponible** y aparece en el feed público. En ese mismo momento se dispara automáticamente el algoritmo de matching (ver sección 4).

---

## 4. El algoritmo de matching

Es el corazón del producto. Funciona así, en términos simples:

1. Cada objeto publicado "dice" dos cosas: qué es, y qué categorías aceptaría a cambio.
2. El sistema arma un mapa de quién podría satisfacer a quién, y busca **ciclos**: cadenas donde cada persona termina dándole su objeto a la siguiente y recibiendo algo que quería de la anterior.
3. Soporta:
   - **Trueque bilateral** (2 personas, el caso simple: "yo te doy lo mío, vos me das lo tuyo").
   - **Trueque en cadena** (3 o más personas, hasta 4 por ahora) — el diferencial de la plataforma frente a un simple marketplace de intercambio.
4. Cuando encuentra un ciclo válido, crea automáticamente una **propuesta de trueque** y **reserva** los objetos involucrados (pasan a estado **En trueque**, dejan de aparecer como disponibles para otros).
5. Si dos ciclos posibles compiten por el mismo objeto, se prioriza el más simple (bilateral antes que cadena larga).

**Importante:** el algoritmo solo *propone*. No cierra el trueque por sí solo — eso requiere que todas las partes lo acepten (sección 5).

---

## 5. Aceptar un trueque propuesto

Cuando el algoritmo genera una propuesta, cada participante la ve en su sección "Mis trueques", con el detalle completo de la cadena (quién le da qué a quién).

- Cada usuario debe presionar **"Aceptar trueque"** para confirmar su parte.
- El trueque queda con estado **Propuesto** hasta que **todas** las partes confirmen.
- Cuando todos confirman, el estado pasa a **Aceptado**.

### 5.1 Confirmación de entrega (segundo paso)

Una vez que un trueque está **Aceptado**, las partes coordinan por el chat interno el punto de encuentro. Cuando el intercambio físico ya ocurrió:

- Cada usuario presiona **"Confirmar que recibí mi objeto"**.
- Cuando **todas** las partes de la cadena confirmaron haber recibido lo suyo, el trueque pasa a estado **Completado**, y los objetos involucrados también quedan marcados como **Completado** (dejan de estar "En trueque").

**Pendiente de definir/construir:** todavía no existe una forma de **cancelar o rechazar** una propuesta desde la interfaz — si alguien no confirma nunca (ni la aceptación ni la entrega), el trueque queda indefinidamente en ese estado y el objeto sigue reservado. Tampoco hay un mecanismo de disputa si una parte dice haber entregado y la otra lo niega.

---

## 6. Chat interno

- Una vez que existe una propuesta de trueque (estado Propuesto o Aceptado), **todas** las partes de esa cadena pueden chatear entre sí en una conversación compartida por trueque.
- El chat es **en tiempo real** (los mensajes aparecen sin recargar la página).
- Solo pueden ver y escribir en el chat quienes son parte de ese trueque específico — nadie más tiene acceso.
- Pensado para coordinar el punto de encuentro y los detalles de la entrega (ver limitación en sección 8: no hay todavía un mecanismo estructurado de "punto de encuentro sugerido" ni moderación del chat).

---

## 7. Reputación y calificaciones

- El esquema de datos ya contempla una calificación (0 a 5 estrellas) y contador de calificaciones por usuario.
- **Todavía no está implementado el flujo para calificar** a la otra parte después de un trueque. Hoy todos los usuarios muestran 0.0 ★.

---

## 8. Pendiente / próximos pasos de negocio

Estas son las piezas de la lógica de negocio original que **todavía no están resueltas** en el producto:

1. **Cancelación / rechazo de una propuesta**: hoy no existe manera de rechazar un match propuesto; el objeto queda reservado indefinidamente si nadie avanza.
2. **Calificación post-trueque**: UI para que cada parte califique a las demás una vez completado (el campo ya existe en la base, falta la pantalla).
3. **Monetización**: sin definir todavía a nivel de producto. Se discutieron ideas (destacar publicaciones, compensación en efectivo sobre trueques desiguales, servicios de verificación/seguro) pero no hay nada construido.
4. **Rol de administrador / moderación**: no existe un panel para gestionar usuarios, publicaciones reportadas o disputas.
5. **Notificaciones**: no hay aviso (email, push) cuando se genera una propuesta de trueque, llega un mensaje nuevo, o alguien confirma su parte — el usuario tiene que entrar a la app para enterarse.
6. **Resolución de disputas**: si una parte confirma "recibí mi objeto" y otra no, o hay desacuerdo sobre el estado de un objeto entregado, no hay ningún mecanismo de mediación.

---

## 9. Aspectos técnicos relevantes para el negocio (resumen no técnico)

- La app está desplegada y accesible públicamente en producción.
- Los datos de cada usuario están protegidos: nadie puede ver ni modificar información de otro usuario más allá de lo que es públicamente necesario (objetos disponibles, perfiles básicos).
- Las fotos de los objetos se almacenan de forma segura y cada usuario solo puede subir/borrar las suyas.
- El sistema fue probado de punta a punta simulando una cadena real de 3 personas, confirmando que el algoritmo arma correctamente el circuito de trueque.
