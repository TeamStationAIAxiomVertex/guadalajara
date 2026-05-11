// Launch note: change SITE_URL here before production if the final domain changes.
export const SITE_URL = "https://imagengdl.com";

export const siteConfig = {
  name: "Sonia McRorey",
  siteName: "Sonia McRorey",
  siteUrl: SITE_URL,
  defaultDescription:
    "Asesoría de imagen ejecutiva, coaching de imagen y talleres de presencia profesional en Guadalajara.",
  defaultOgImage: `${SITE_URL}/assets/sonia-twitter-card.png`,
  phone: "+52 664 610 5348",
  whatsapp:
    "https://wa.me/526646105348?text=Hola%20Sonia%2C%20me%20interesa%20agendar%20un%20diagn%C3%B3stico.",
  address:
    "Av. Adolfo López Mateos Norte 95, Col. Italia Providencia, Guadalajara, Jalisco, 44648, México",
  city: "Guadalajara",
  region: "Jalisco",
  country: "MX",
  instagram: "https://www.instagram.com/soniamcrorey/",
  linkedin: "https://mx.linkedin.com/in/smcasesoradeimagen",
};

export const routes = [
  {
    route: "/",
    file: "index.html",
    title: "Consultora de Imagen en Guadalajara | Sonia McRorey",
    description:
      "Asesoría de imagen, coaching de presencia y talleres para líderes, profesionistas y empresas en Guadalajara con Sonia McRorey.",
    image: `${SITE_URL}/assets/sonia-twitter-card.png`,
    h1: "Consultora de imagen en Guadalajara",
    schema: ["Organization", "WebSite", "WebPage", "FAQPage", "HowTo"],
    anySchema: ["LocalBusiness", "ProfessionalService"],
    primaryKeyword: "consultora de imagen en Guadalajara",
    requiredLinks: ["/asesoria-imagen-ejecutiva-guadalajara/", "/coaching-presencia-profesional/", "/talleres-imagen-corporativa/", "/#contacto"],
  },
  {
    route: "/asesoria-imagen-ejecutiva-guadalajara/",
    file: "asesoria-imagen-ejecutiva-guadalajara/index.html",
    title: "Asesoría de Imagen Ejecutiva en Guadalajara | Sonia McRorey",
    description:
      "Proceso de asesoría de imagen integral para alinear presencia, estilo, color, guardarropa y decisiones profesionales en Guadalajara.",
    image: `${SITE_URL}/assets/social-card-asesoria-imagen-ejecutiva.png`,
    h1: "Asesoría de Imagen Ejecutiva en Guadalajara",
    schema: ["Service", "ProfessionalService", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"],
    primaryKeyword: "asesoría de imagen ejecutiva en Guadalajara",
    requiredLinks: ["/#inicio", "/#contacto", "/coaching-presencia-profesional/", "/colorimetria-ejecutiva/", "https://imagencoach.com/imagen-presencia/"],
  },
  {
    route: "/coaching-presencia-profesional/",
    file: "coaching-presencia-profesional/index.html",
    title: "Coaching de Imagen Profesional | Sonia McRorey",
    description:
      "Coaching de imagen para trabajar identidad, autoconcepto, seguridad, presencia profesional y claridad para sostener tu siguiente nivel.",
    image: `${SITE_URL}/assets/social-card-coaching-imagen-profesional.png`,
    h1: "Coaching de Imagen Profesional",
    schema: ["Service", "ProfessionalService", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"],
    primaryKeyword: "coaching de imagen profesional",
    requiredLinks: ["/#inicio", "/#contacto", "/asesoria-imagen-ejecutiva-guadalajara/", "/marca-personal-para-lideres/", "https://imagencoach.com/imagen-presencia/"],
  },
  {
    route: "/talleres-imagen-corporativa/",
    file: "talleres-imagen-corporativa/index.html",
    title: "Talleres de Imagen Corporativa | Sonia McRorey",
    description:
      "Talleres de imagen para personas, marcas y empresas que buscan presencia profesional, comunicación clara y mejor percepción del cliente.",
    image: `${SITE_URL}/assets/social-card-talleres-imagen-corporativa.png`,
    h1: "Talleres de Imagen Corporativa",
    schema: ["Service", "ProfessionalService", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"],
    primaryKeyword: "talleres de imagen corporativa",
    requiredLinks: ["/#inicio", "/#contacto", "/asesoria-imagen-ejecutiva-guadalajara/", "/coaching-presencia-profesional/", "https://imagencoach.com/imagen-presencia/"],
  },
  {
    route: "/colorimetria-ejecutiva/",
    file: "colorimetria-ejecutiva/index.html",
    title: "Colorimetría Ejecutiva en Guadalajara | Sonia McRorey",
    description:
      "Colorimetría aplicada a imagen profesional para elegir tonos, guardarropa y presencia visual con intención en Guadalajara.",
    image: `${SITE_URL}/assets/social-card-colorimetria-ejecutiva.png`,
    h1: "Colorimetría Ejecutiva",
    schema: ["Service", "ProfessionalService", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"],
    primaryKeyword: "colorimetría ejecutiva",
    requiredLinks: ["/#inicio", "/#contacto", "/asesoria-imagen-ejecutiva-guadalajara/", "https://imagencoach.com/imagen-presencia/"],
  },
  {
    route: "/marca-personal-para-lideres/",
    file: "marca-personal-para-lideres/index.html",
    title: "Marca Personal para Líderes | Sonia McRorey",
    description:
      "Marca personal para líderes, profesionistas y empresarios que necesitan comunicar identidad, confianza, autoridad y posicionamiento.",
    image: `${SITE_URL}/assets/social-card-marca-personal-lideres.png`,
    h1: "Marca Personal para Líderes",
    schema: ["Service", "ProfessionalService", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"],
    primaryKeyword: "marca personal para líderes",
    requiredLinks: ["/#inicio", "/#contacto", "/coaching-presencia-profesional/", "/asesoria-imagen-ejecutiva-guadalajara/", "https://imagencoach.com/imagen-presencia/"],
  },
];
