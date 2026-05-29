import { motion } from 'framer-motion';

const LAST_UPDATED = '25 de mayo de 2026';

const sections = [
  {
    id: 'acceptance',
    title: '1. Aceptación de los términos',
    body: `Al registrarte o utilizar EthosHub ("la plataforma", "nosotros"), aceptas quedar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la plataforma.

EthosHub está operado por Bytebusters. Nos reservamos el derecho de actualizar estos términos. Te notificaremos sobre cambios materiales con al menos 14 días de anticipación.`,
  },
  {
    id: 'eligibility',
    title: '2. Elegibilidad',
    body: `Para usar EthosHub debes:

• Tener al menos 16 años de edad.
• Proporcionar información veraz y actualizada durante el registro.
• No tener una cuenta previamente suspendida o eliminada por violación de estos términos.

Si estás usando la plataforma en nombre de una organización, declaras que tienes autorización para aceptar estos términos en su nombre.`,
  },
  {
    id: 'account',
    title: '3. Tu cuenta',
    body: `Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades que ocurran bajo tu cuenta.

Notifícanos inmediatamente si sospechas de acceso no autorizado a tu cuenta (contacto.bytebusters@gmail.com). No seremos responsables por pérdidas derivadas del uso no autorizado de tu cuenta cuando éste se deba a tu negligencia.

Puedes eliminar tu cuenta en cualquier momento desde los ajustes de tu perfil.`,
  },
  {
    id: 'content',
    title: '4. Contenido del usuario',
    body: `Al publicar contenido en EthosHub (perfil, proyectos, habilidades, descripciones), declaras que:

• Tienes los derechos necesarios sobre dicho contenido.
• El contenido no infringe derechos de terceros.
• El contenido es verídico y no engañoso.

Nos concedes una licencia mundial, no exclusiva, libre de regalías para mostrar, reproducir y distribuir tu contenido dentro de la plataforma con el único propósito de operar el servicio.

Nos reservamos el derecho de eliminar contenido que viole estos términos sin previo aviso.`,
  },
  {
    id: 'prohibited',
    title: '5. Uso prohibido',
    body: `Está prohibido:

• Publicar información falsa, engañosa o fraudulenta.
• Hacerse pasar por otra persona u organización.
• Usar la plataforma para actividades ilegales.
• Realizar scraping, crawling o extracción masiva de datos sin autorización.
• Intentar acceder a sistemas o datos de la plataforma de forma no autorizada.
• Enviar spam o comunicaciones no solicitadas a otros usuarios.
• Publicar contenido ofensivo, discriminatorio o que incite al odio.
• Revender o sublicenciar el acceso a la plataforma.`,
  },
  {
    id: 'intellectual',
    title: '6. Propiedad intelectual',
    body: `EthosHub y todo su contenido original (diseño, código, marca, logotipos, textos propios) son propiedad de Bytebusters y están protegidos por las leyes de propiedad intelectual aplicables.

No puedes reproducir, distribuir, modificar ni crear obras derivadas de nuestro contenido sin autorización expresa por escrito.

La mascota EthosHub (el búho con capucha) y el nombre "EthosHub" son marcas de Bytebusters.`,
  },
  {
    id: 'third-party',
    title: '7. Servicios de terceros',
    body: `EthosHub permite conectar servicios de terceros como GitHub y LinkedIn. El uso de dichos servicios está sujeto a sus propias políticas de privacidad y términos de uso. No somos responsables de las prácticas de privacidad o contenido de servicios externos.`,
  },
  {
    id: 'liability',
    title: '8. Limitación de responsabilidad',
    body: `La plataforma se proporciona "tal cual" sin garantías de ningún tipo. En la máxima medida permitida por la ley aplicable:

• No garantizamos la disponibilidad ininterrumpida del servicio.
• No somos responsables de pérdidas de datos, lucro cesante ni daños indirectos.
• Nuestra responsabilidad total ante ti no excederá el monto pagado por el servicio en los últimos 12 meses (o USD $10 si el servicio fue gratuito).`,
  },
  {
    id: 'termination',
    title: '9. Suspensión y terminación',
    body: `Nos reservamos el derecho de suspender o terminar tu acceso a EthosHub, con o sin previo aviso, si:

• Violas estos Términos de Uso.
• Tu conducta pone en riesgo a otros usuarios o a la plataforma.
• Así lo requiere la ley.

Puedes cesar el uso de la plataforma y eliminar tu cuenta en cualquier momento. Las secciones de propiedad intelectual, limitación de responsabilidad e indemnización sobrevivirán a la terminación.`,
  },
  {
    id: 'law',
    title: '10. Ley aplicable',
    body: `Estos términos se rigen por las leyes de Bolivia. Cualquier disputa se resolverá en los tribunales competentes de Bolivia, salvo que ambas partes acuerden un mecanismo alternativo de resolución de conflictos.`,
  },
  {
    id: 'contact',
    title: '11. Contacto',
    body: `Para preguntas sobre estos Términos de Uso:

**EthosHub · Bytebusters**
contacto.bytebusters@gmail.com`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/6 py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.14) 0%, transparent 65%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-violet-400"
          >
            Legal
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2rem,5vw,3rem)] font-black tracking-tight text-white"
          >
            Términos de Uso
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="mt-3 text-sm text-white/35"
          >
            Última actualización: {LAST_UPDATED}
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-12">
          {sections.map((section, i) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <h2 className="mb-4 text-lg font-bold text-white">{section.title}</h2>
              <div className="space-y-3 text-sm leading-7 text-white/50">
                {section.body.split('\n\n').map((para, j) => (
                  <p key={j} className="whitespace-pre-line">
                    {para.split(/(\*\*[^*]+\*\*)/).map((chunk, k) =>
                      chunk.startsWith('**') && chunk.endsWith('**') ? (
                        <strong key={k} className="font-semibold text-white/75">
                          {chunk.slice(2, -2)}
                        </strong>
                      ) : (
                        chunk
                      )
                    )}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 border-t border-white/6 pt-8 text-xs text-white/22">
          <p>© 2026 EthosHub · Bytebusters. Todos los derechos reservados.</p>
        </div>
      </section>
    </div>
  );
}
