import { motion } from 'framer-motion';

/**
 * Static privacy policy page.
 */
const LAST_UPDATED = '25 de mayo de 2026';

const sections = [
  {
    id: 'intro',
    title: '1. Introducción',
    body: `EthosHub ("nosotros", "nuestro" o "la plataforma") se compromete a proteger la privacidad de sus usuarios. Esta Política de Privacidad describe qué información recopilamos, cómo la usamos y qué derechos tienes sobre ella.

Al acceder o utilizar EthosHub, aceptas los términos de esta política. Si no estás de acuerdo, te pedimos que no utilices la plataforma.`,
  },
  {
    id: 'data',
    title: '2. Información que recopilamos',
    body: `Recopilamos información que nos proporcionas directamente, información generada por tu uso de la plataforma y, en algunos casos, datos de terceros.

**Información de cuenta:** nombre, dirección de correo electrónico, contraseña (almacenada de forma cifrada), foto de perfil y preferencias de idioma.

**Información de perfil profesional:** experiencia laboral, educación, habilidades técnicas, proyectos, y enlaces a repositorios o portfolios externos.

**Integraciones de terceros:** si conectas GitHub o LinkedIn, accedemos únicamente a los datos necesarios para enriquecer tu perfil (actividad de commits, experiencia laboral pública). No accedemos a repositorios privados ni a mensajes privados.

**Datos de uso:** páginas visitadas, tiempo de sesión, acciones dentro de la plataforma e información técnica del dispositivo (tipo de navegador, sistema operativo, dirección IP).`,
  },
  {
    id: 'use',
    title: '3. Uso de la información',
    body: `Utilizamos tu información para:

• Crear y mantener tu cuenta y perfil profesional.
• Permitir que reclutadores y profesionales descubran talento relevante.
• Personalizar tu experiencia en la plataforma.
• Enviarte notificaciones relacionadas con tu actividad (puedes desactivarlas en ajustes).
• Mejorar la plataforma mediante análisis de uso agregado y anonimizado.
• Cumplir con obligaciones legales aplicables.

No utilizamos tu información para vender publicidad personalizada ni la vendemos a terceros.`,
  },
  {
    id: 'sharing',
    title: '4. Compartición de información',
    body: `Tu perfil público es visible para otros usuarios de EthosHub según la configuración de visibilidad que establezcas. Puedes ajustar estos permisos en cualquier momento desde tu panel de control.

Solo compartimos información con terceros en los siguientes casos:

• **Proveedores de servicios:** empresas que nos ayudan a operar la plataforma (hosting, análisis, email). Están contractualmente obligados a proteger tu información.
• **Requisitos legales:** si la ley nos obliga a divulgar información, lo haremos notificándote en la medida permitida.
• **Protección de derechos:** para proteger los derechos, la seguridad o la propiedad de EthosHub, nuestros usuarios o el público.`,
  },
  {
    id: 'storage',
    title: '5. Almacenamiento y seguridad',
    body: `Almacenamos tus datos en servidores seguros con cifrado en tránsito (TLS) y en reposo. Las contraseñas se almacenan usando funciones de hash unidireccionales (bcrypt).

Tomamos medidas razonables para proteger tu información, pero ningún sistema es completamente infalible. En caso de una brecha de seguridad que afecte tus datos, te notificaremos en el menor tiempo posible.`,
  },
  {
    id: 'rights',
    title: '6. Tus derechos',
    body: `Tienes derecho a:

• **Acceder** a los datos personales que tenemos sobre ti.
• **Rectificar** información incorrecta o incompleta.
• **Eliminar** tu cuenta y los datos asociados.
• **Exportar** tu información en un formato legible.
• **Limitar** el procesamiento de tus datos en ciertas circunstancias.

Para ejercer estos derechos, contáctanos en contacto.bytebusters@gmail.com. Responderemos en un plazo máximo de 30 días.`,
  },
  {
    id: 'cookies',
    title: '7. Cookies',
    body: `Utilizamos cookies esenciales para el funcionamiento de la plataforma (autenticación, preferencias de sesión). No utilizamos cookies de rastreo publicitario de terceros.

Puedes configurar tu navegador para rechazar cookies, pero esto puede afectar el funcionamiento de algunas partes de la plataforma.`,
  },
  {
    id: 'minors',
    title: '8. Menores de edad',
    body: `EthosHub no está dirigido a personas menores de 16 años. No recopilamos intencionadamente información de menores. Si detectamos que un menor ha creado una cuenta, la eliminaremos de forma inmediata.`,
  },
  {
    id: 'changes',
    title: '9. Cambios en esta política',
    body: `Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos mediante un aviso en la plataforma o por correo electrónico. El uso continuado de EthosHub tras la actualización implica la aceptación de la nueva política.`,
  },
  {
    id: 'contact',
    title: '10. Contacto',
    body: `Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos en:

**EthosHub · Bytebusters**
contacto.bytebusters@gmail.com`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black">
      {}
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
            Política de Privacidad
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

      {}
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

        {}
        <div className="mt-16 border-t border-white/6 pt-8 text-xs text-white/22">
          <p>© 2026 EthosHub · Bytebusters. Todos los derechos reservados.</p>
        </div>
      </section>
    </div>
  );
}
