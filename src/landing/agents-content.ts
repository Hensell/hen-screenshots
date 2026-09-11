import type { InterfaceLocale } from "../i18n/core.ts";

// Build-time copy: the guide is readable and translated without JavaScript.
export const agentMessages: Record<string, readonly [string, string]> = {
  "Version 0.2.1 is available from OpenAI, GitHub, and the ZIP below. Includes support for projects with background images.":
    [
      "La versión 0.2.1 está disponible en OpenAI, GitHub y el ZIP de abajo. Incluye soporte para proyectos con imágenes de fondo.",
      "A versão 0.2.1 está disponível na OpenAI, no GitHub e no ZIP abaixo. Inclui suporte a projetos com imagens de fundo.",
    ],
  "Download ZIP": ["Descargar ZIP", "Baixar ZIP"],
  "Can I reuse my own templates with an agent?": [
    "¿Puedo reutilizar mis plantillas con un agente?",
    "Posso reutilizar meus modelos com um agente?",
  ],
  "Yes. In the web studio, open My templates, import a .hentemplate file if needed, and open it as a new project. Add your captures, then download the .henscreenshots project file. Give that file to your agent for rendering with plugin v0.2.1 or newer, which preserves background images. The plugin reads project files, not .hentemplate files or your browser library.":
    [
      "Sí. En el estudio web, abre Mis plantillas, importa un archivo .hentemplate si hace falta y ábrelo como proyecto nuevo. Añade tus capturas y descarga el archivo de proyecto .henscreenshots. Dale ese archivo a tu agente para renderizarlo con el plugin v0.2.1 o posterior, que conserva las imágenes de fondo. El plugin lee archivos de proyecto, no archivos .hentemplate ni tu biblioteca del navegador.",
      "Sim. No estúdio web, abra Meus modelos, importe um arquivo .hentemplate se necessário e abra-o como um novo projeto. Adicione suas capturas e baixe o arquivo de projeto .henscreenshots. Entregue esse arquivo ao agente para renderizar com o plugin v0.2.1 ou mais recente, que preserva as imagens de fundo. O plugin lê arquivos de projeto, não arquivos .hentemplate nem sua biblioteca do navegador.",
    ],
  "Does the plugin update automatically?": [
    "¿El plugin se actualiza automáticamente?",
    "O plugin é atualizado automaticamente?",
  ],
  "Website deployments do not update a plugin on your computer. For a ZIP installation, extract the new version to a new folder and run setup there. For a marketplace installation, follow the update instructions in the plugin README. Start a new agent session and run doctor after updating. Directory versions can lag behind the website download.":
    [
      "Los despliegues de la web no actualizan el plugin de tu computadora. Si usas el ZIP, extrae la nueva versión en otra carpeta y ejecuta la instalación allí. Si lo instalaste desde un catálogo, sigue las instrucciones de actualización del README del plugin. Inicia una sesión nueva del agente y ejecuta doctor después de actualizar. Las versiones de los directorios pueden ir por detrás de la descarga de la web.",
      "As publicações do site não atualizam o plugin no seu computador. Se você usa o ZIP, extraia a nova versão em outra pasta e execute a configuração nela. Se instalou por um catálogo, siga as instruções de atualização no README do plugin. Inicie uma nova sessão do agente e execute doctor após atualizar. As versões dos diretórios podem estar atrás da versão disponível no site.",
    ],
  "Plugin update instructions": [
    "Instrucciones para actualizar el plugin",
    "Instruções para atualizar o plugin",
  ],

  "Reviewed and published in the OpenAI Plugins Directory.": [
    "Revisado y publicado en el directorio de plugins de OpenAI.",
    "Revisado e publicado no diretório de plugins da OpenAI.",
  ],
  "Local rendering · Node.js 22.12+ · One-time setup": [
    "Renderizado local · Node.js 22.12+ · Configuración inicial",
    "Renderização local · Node.js 22.12+ · Configuração inicial",
  ],
  "Download ZIP instead": [
    "También puedes descargar el ZIP",
    "Você também pode baixar o ZIP",
  ],
  "Choose Codex or Claude Code below for installation. If you prefer a manual ZIP setup, follow these steps.":
    [
      "Elige Codex o Claude Code más abajo para ver cómo instalarlo. Si prefieres instalarlo manualmente con el ZIP, sigue estos pasos.",
      "Escolha Codex ou Claude Code abaixo para ver como instalar. Se preferir a instalação manual pelo ZIP, siga estes passos.",
    ],
  "Manual ZIP setup": [
    "Instalación manual con el ZIP",
    "Instalação manual pelo ZIP",
  ],
  "Install from OpenAI": ["Instalar desde OpenAI", "Instalar pela OpenAI"],
  "Open the listing and choose Install plugin. For local rendering, start a new Codex task in your app project and ask Hen Screenshots to run doctor and complete setup. Then give it your screenshot folder and a brief from the examples below.":
    [
      "Abre la ficha y selecciona Install plugin. Para renderizar localmente, inicia una tarea nueva en Codex dentro del proyecto de tu app y pídele a Hen Screenshots que ejecute doctor y complete la instalación. Después, indícale la carpeta de tus capturas y usa una de las solicitudes de ejemplo más abajo.",
      "Abra a página do plugin e selecione Install plugin. Para renderizar localmente, inicie uma nova tarefa no Codex dentro do projeto do seu app e peça ao Hen Screenshots que execute doctor e conclua a configuração. Depois, indique a pasta das suas capturas e use uma das solicitações de exemplo abaixo.",
    ],
  "Use with AI agents — Hen Screenshots": [
    "Usar con agentes de IA — Hen Screenshots",
    "Usar com agentes de IA — Hen Screenshots",
  ],
  "Download the local Hen Screenshots plugin. Set it up for Codex or Claude Code, create screenshot series, and keep editing in the web studio.":
    [
      "Descarga el plugin local de Hen Screenshots. Prepáralo para Codex o Claude Code, crea series de capturas y sigue editándolas en el estudio web.",
      "Baixe o plugin local do Hen Screenshots. Configure-o para o Codex ou Claude Code, crie séries de capturas e continue editando no estúdio web.",
    ],
  "Install from GitHub": ["Instalar desde GitHub", "Instalar pelo GitHub"],
  "Run these commands in your terminal to install from the Hen marketplace. Start a new Codex task, then ask Hen to run doctor and complete setup if needed.":
    [
      "Ejecuta estos comandos en tu terminal para instalar desde el catálogo de Hen. Inicia una tarea nueva en Codex y pídele a Hen que ejecute doctor y complete la instalación si hace falta.",
      "Execute estes comandos no terminal para instalar pelo catálogo do Hen. Inicie uma nova tarefa no Codex e peça ao Hen que execute doctor e conclua a configuração, se necessário.",
    ],
  "Run these commands inside Claude Code, then start a new session. Ask Hen to run doctor and complete setup before creating your first series.":
    [
      "Ejecuta estos comandos dentro de Claude Code e inicia una sesión nueva. Pídele a Hen que ejecute doctor y complete la instalación antes de crear tu primera serie.",
      "Execute estes comandos dentro do Claude Code e inicie uma nova sessão. Peça ao Hen que execute doctor e conclua a configuração antes de criar sua primeira série.",
    ],
  "Release notes and checksums": [
    "Notas de la versión y sumas de verificación",
    "Notas da versão e somas de verificação",
  ],
  Installation: ["Instalación", "Instalação"],
  Examples: ["Ejemplos", "Exemplos"],
  "Your files": ["Tus archivos", "Seus arquivos"],
  "On this page": ["En esta página", "Nesta página"],
  "THE LOCAL PLUGIN": ["EL PLUGIN LOCAL", "O PLUGIN LOCAL"],
  "Use with AI agents.": ["Usar con agentes de IA.", "Usar com agentes de IA."],
  "Your captures. A clear brief. A finished series.": [
    "Tus capturas. Una idea clara. Una serie lista.",
    "Suas capturas. Uma ideia clara. Uma série pronta.",
  ],
  "Let Codex or Claude Code choose templates, compose your screenshots, and write captions in several languages. Then fine-tune the result in Hen Screenshots.":
    [
      "Deja que Codex o Claude Code elija las plantillas, componga tus capturas y escriba los textos en varios idiomas. Después, ajusta el resultado en Hen Screenshots.",
      "Deixe o Codex ou Claude Code escolher os modelos, compor suas capturas e escrever os textos em vários idiomas. Depois, ajuste o resultado no Hen Screenshots.",
    ],
  "Local plugin": ["Plugin local", "Plugin local"],
  "A small plugin. Your whole studio.": [
    "Un pequeño plugin. Todo tu estudio.",
    "Um pequeno plugin. Todo o seu estúdio.",
  ],
  "Download plugin": ["Descargar plugin", "Baixar plugin"],
  "ZIP · Node.js 22.12+ · One-time setup": [
    "ZIP · Node.js 22.12+ · Configuración inicial",
    "ZIP · Node.js 22.12+ · Configuração inicial",
  ],
  "View source & documentation": [
    "Ver código y documentación",
    "Ver código e documentação",
  ],
  "Get ready once.": ["Prepáralo una vez.", "Configure uma vez."],
  "This plugin runs on your computer. You need Node.js 22.12 or newer, npm, and Codex or Claude Code with access to your local files and terminal.":
    [
      "Este plugin se ejecuta en tu computadora. Necesitas Node.js 22.12 o posterior, npm y Codex o Claude Code con acceso a tus archivos locales y al terminal.",
      "Este plugin é executado no seu computador. Você precisa do Node.js 22.12 ou mais recente, npm e Codex ou Claude Code com acesso aos arquivos locais e ao terminal.",
    ],
  "Download and extract the ZIP.": [
    "Descarga y descomprime el ZIP.",
    "Baixe e extraia o ZIP.",
  ],
  "Keep the extracted hen-screenshots folder somewhere permanent. It contains the renderer, fonts, and instructions your agent will use.":
    [
      "Guarda la carpeta hen-screenshots en una ubicación permanente. Contiene el motor de renderizado, las fuentes y las instrucciones que usará tu agente.",
      "Guarde a pasta hen-screenshots em um local permanente. Ela contém o renderizador, as fontes e as instruções que seu agente vai usar.",
    ],
  "Install the local dependencies.": [
    "Instala las dependencias locales.",
    "Instale as dependências locais.",
  ],
  "Open a terminal inside the extracted hen-screenshots folder and run these commands. Setup needs an internet connection to download the rendering libraries.":
    [
      "Abre un terminal dentro de la carpeta hen-screenshots que descomprimiste y ejecuta estos comandos. La instalación necesita internet para descargar las librerías de renderizado.",
      "Abra um terminal dentro da pasta hen-screenshots extraída e execute estes comandos. A instalação precisa de internet para baixar as bibliotecas de renderização.",
    ],
  Copy: ["Copiar", "Copiar"],
  "Check the result.": ["Comprueba el resultado.", "Confira o resultado."],
  'The doctor command should report "ok": true. You can now use either agent below. The ZIP does not install itself or register a plugin in an agent marketplace.':
    [
      'El comando doctor debe indicar "ok": true. Ya puedes usar cualquiera de los agentes de abajo. El ZIP no se instala solo ni registra un plugin en el catálogo de un agente.',
      'O comando doctor deve informar "ok": true. Agora você pode usar qualquer um dos agentes abaixo. O ZIP não se instala sozinho nem registra um plugin no catálogo de um agente.',
    ],
  "Get Node.js": ["Descargar Node.js", "Baixar Node.js"],
  "Free plugin. Bring your own agent.": [
    "Plugin gratuito. Usa tu propio agente.",
    "Plugin grátis. Use seu próprio agente.",
  ],
  "Hen Screenshots adds no subscription or API key. Your Codex or Claude plan and usage costs still apply. The plugin renders locally; files you share with your agent follow that provider’s data policies.":
    [
      "Hen Screenshots no añade una suscripción ni pide una clave API. Se siguen aplicando el plan y los costos de uso de Codex o Claude. El plugin renderiza localmente; los archivos que compartas con tu agente están sujetos a las políticas de datos de ese proveedor.",
      "O Hen Screenshots não adiciona assinatura nem pede chave de API. O plano e os custos de uso do Codex ou Claude continuam valendo. O plugin renderiza localmente; os arquivos que você compartilhar com seu agente seguem as políticas de dados desse provedor.",
    ],
  "Start with a local task.": [
    "Empieza con una tarea local.",
    "Comece com uma tarefa local.",
  ],
  "If you downloaded the ZIP instead, open your app project in Codex and ask it to read the bundled skill directly. This works without a marketplace installation.":
    [
      "Si descargaste el ZIP, abre el proyecto de tu app en Codex y pídele que lea directamente la skill incluida. Funciona sin instalar desde un catálogo.",
      "Se você baixou o ZIP, abra o projeto do seu app no Codex e peça que ele leia diretamente a skill incluída. Funciona sem instalar por um catálogo.",
    ],
  "In the prompt, replace PLUGIN_FOLDER with the full path to the extracted hen-screenshots folder, and CAPTURES_FOLDER with the folder containing your screenshots. Keep paths inside quotes if they contain spaces.":
    [
      "En el mensaje, sustituye PLUGIN_FOLDER por la ruta completa de la carpeta hen-screenshots y CAPTURES_FOLDER por la carpeta de tus capturas. Mantén las rutas entre comillas si tienen espacios.",
      "Na mensagem, substitua PLUGIN_FOLDER pelo caminho completo da pasta hen-screenshots e CAPTURES_FOLDER pela pasta das suas capturas. Mantenha os caminhos entre aspas se tiverem espaços.",
    ],
  "About Codex skills": [
    "Sobre las skills de Codex",
    "Sobre as skills do Codex",
  ],
  "Load the plugin for your session.": [
    "Carga el plugin para tu sesión.",
    "Carregue o plugin para a sua sessão.",
  ],
  "If you downloaded the ZIP instead, complete setup in that folder, then open a terminal in your app project. Replace PLUGIN_FOLDER with the full path to the extracted plugin and start Claude Code:":
    [
      "Si descargaste el ZIP, completa la instalación en esa carpeta y abre un terminal en el proyecto de tu app. Sustituye PLUGIN_FOLDER por la ruta completa del plugin descomprimido e inicia Claude Code:",
      "Se você baixou o ZIP, conclua a configuração nessa pasta e abra um terminal no projeto do seu app. Substitua PLUGIN_FOLDER pelo caminho completo do plugin extraído e inicie o Claude Code:",
    ],
  "The --plugin-dir option loads the plugin for this session. Then send this request, replacing CAPTURES_FOLDER with your screenshot folder:":
    [
      "La opción --plugin-dir carga el plugin para esta sesión. Después, envía esta solicitud y sustituye CAPTURES_FOLDER por la carpeta de tus capturas:",
      "A opção --plugin-dir carrega o plugin para esta sessão. Depois, envie esta solicitação e substitua CAPTURES_FOLDER pela pasta das suas capturas:",
    ],
  "Claude Code local plugin guide": [
    "Guía de plugins locales de Claude Code",
    "Guia de plugins locais do Claude Code",
  ],
  "Give it a useful brief.": ["Dale una idea clara.", "Dê uma direção clara."],
  "Once the skill is loaded, these requests work with either agent. Tell it which images to use, where you will publish, and what makes your app worth trying.":
    [
      "Una vez cargada la skill, estas solicitudes sirven para cualquiera de los dos agentes. Dile qué imágenes usar, dónde vas a publicarlas y qué hace que valga la pena probar tu app.",
      "Depois de carregar a skill, estas solicitações funcionam com qualquer um dos agentes. Diga quais imagens usar, onde você vai publicar e por que vale a pena experimentar seu app.",
    ],
  "A portfolio composition": [
    "Una composición para tu portafolio",
    "Uma composição para seu portfólio",
  ],
  Prompt: ["Mensaje", "Mensagem"],
  "The same design, in more languages": [
    "El mismo diseño, en más idiomas",
    "O mesmo design, em mais idiomas",
  ],
  "Translations come from your agent. This plugin does not download Gemma or any other translation model. Review the wording and every exported image before publishing.":
    [
      "Las traducciones las hace tu agente. Este plugin no descarga Gemma ni otro modelo de traducción. Revisa la redacción y cada imagen exportada antes de publicar.",
      "As traduções são feitas pelo seu agente. Este plugin não baixa o Gemma nem outro modelo de tradução. Revise os textos e cada imagem exportada antes de publicar.",
    ],
  "Ready to export. Still yours to edit.": [
    "Listo para exportar. Siempre editable.",
    "Pronto para exportar. Sempre editável.",
  ],
  "Each run writes to a new output folder. Your original captures stay unchanged, and the plugin checks the export dimensions and opaque RGB PNG format.":
    [
      "Cada ejecución guarda el resultado en una carpeta nueva. Tus capturas originales quedan intactas y el plugin comprueba las dimensiones de exportación y el formato PNG RGB sin transparencia.",
      "Cada execução salva o resultado em uma pasta nova. Suas capturas originais ficam intactas, e o plugin verifica as dimensões de exportação e o formato PNG RGB sem transparência.",
    ],
  "See the whole series at a glance.": [
    "Mira toda la serie de un vistazo.",
    "Veja toda a série de uma vez.",
  ],
  "PNG exports organized by language.": [
    "Exportaciones PNG organizadas por idioma.",
    "Exportações PNG organizadas por idioma.",
  ],
  "The editable project, including images and captions.": [
    "El proyecto editable, con imágenes y textos.",
    "O projeto editável, com imagens e textos.",
  ],
  "Export dimensions and validation results.": [
    "Dimensiones de exportación y resultados de validación.",
    "Dimensões de exportação e resultados de validação.",
  ],
  "Continue in the web studio": [
    "Sigue en el estudio web",
    "Continue no estúdio web",
  ],
  "Open the studio, choose Open project file on the project screen, and select project.henscreenshots from the output folder. Adjust the text, colors, or device placement and export again.":
    [
      "Abre el estudio, elige Abrir archivo del proyecto en la pantalla de proyectos y selecciona project.henscreenshots en la carpeta de resultados. Ajusta los textos, los colores o la posición de los dispositivos y vuelve a exportar.",
      "Abra o estúdio, escolha Abrir arquivo do projeto na tela de projetos e selecione project.henscreenshots na pasta de resultados. Ajuste os textos, as cores ou a posição dos dispositivos e exporte novamente.",
    ],
  "A few things to know.": [
    "Un par de cosas más.",
    "Mais algumas informações.",
  ],
  "Is it in the Codex or Claude plugin store?": [
    "¿Está en la tienda de plugins de Codex o Claude?",
    "Está na loja de plugins do Codex ou Claude?",
  ],
  "Hen Screenshots is published in the OpenAI Plugins Directory. Our Anthropic directory submission is still under review; you can already use it in Claude Code through our GitHub marketplace or the ZIP. All installation methods require one-time local dependency setup.":
    [
      "Hen Screenshots está publicado en el directorio de plugins de OpenAI. La solicitud para el directorio de Anthropic sigue en revisión; ya puedes usarlo en Claude Code desde nuestro catálogo de GitHub o con el ZIP. Todos los métodos requieren instalar las dependencias locales una vez.",
      "O Hen Screenshots está publicado no diretório de plugins da OpenAI. A solicitação para o diretório da Anthropic segue em análise; você já pode usá-lo no Claude Code pelo nosso catálogo no GitHub ou pelo ZIP. Todos os métodos exigem instalar as dependências locais uma vez.",
    ],
  "Which images can I use?": [
    "¿Qué imágenes puedo usar?",
    "Quais imagens posso usar?",
  ],
  "The plugin accepts PNG, JPEG, and still WebP: up to 50 MB and 24 megapixels per image, and 120 MB combined. Convert HEIC, AVIF, or animated files first, or use the web studio for its additional import formats.":
    [
      "El plugin acepta PNG, JPEG y WebP estático: hasta 50 MB y 24 megapíxeles por imagen, y 120 MB en total. Convierte primero los archivos HEIC, AVIF o animados, o usa el estudio web, que admite más formatos de importación.",
      "O plugin aceita PNG, JPEG e WebP estático: até 50 MB e 24 megapixels por imagem, e 120 MB no total. Converta antes os arquivos HEIC, AVIF ou animados, ou use o estúdio web, que aceita mais formatos de importação.",
    ],
  "Setup or rendering failed. What now?": [
    "La instalación o el renderizado falló. ¿Qué hago?",
    "A instalação ou a renderização falhou. O que faço?",
  ],
  "Check node --version, then run npm ci --omit=dev in the extracted plugin folder and retry doctor. Native rendering libraries need a supported operating system and architecture. If an output folder already exists, choose a new name. Share the error and your OS when asking for help.":
    [
      "Comprueba node --version, ejecuta npm ci --omit=dev en la carpeta del plugin y vuelve a probar doctor. Las librerías de renderizado necesitan un sistema operativo y una arquitectura compatibles. Si la carpeta de resultados ya existe, elige otro nombre. Incluye el error y tu sistema operativo cuando pidas ayuda.",
      "Confira node --version, execute npm ci --omit=dev na pasta do plugin e tente doctor novamente. As bibliotecas de renderização precisam de um sistema operacional e uma arquitetura compatíveis. Se a pasta de resultados já existir, escolha outro nome. Informe o erro e seu sistema operacional ao pedir ajuda.",
    ],
  "Does the plugin replace the web studio?": [
    "¿El plugin reemplaza al estudio web?",
    "O plugin substitui o estúdio web?",
  ],
  "Use the plugin to draft and export in batches, and the studio for hands-on adjustments. The current plugin does not support source-only Wear OS exports. Native and browser font rendering may also differ slightly.":
    [
      "Usa el plugin para preparar y exportar series, y el estudio para hacer ajustes manuales. El plugin actual no admite exportaciones de Wear OS que usan únicamente la captura original. El renderizado de las fuentes también puede variar un poco entre el plugin y el navegador.",
      "Use o plugin para preparar e exportar séries, e o estúdio para fazer ajustes manuais. O plugin atual não aceita exportações do Wear OS que usam apenas a captura original. A renderização das fontes também pode variar um pouco entre o plugin e o navegador.",
    ],
  "Need a hand? Email Hensell.": [
    "¿Necesitas ayuda? Escríbele a Hensell.",
    "Precisa de ajuda? Escreva para o Hensell.",
  ],
  "Copied to clipboard.": [
    "Copiado al portapapeles.",
    "Copiado para a área de transferência.",
  ],
  "Could not copy. Select the text and copy it manually.": [
    "No se pudo copiar. Selecciona el texto y cópialo manualmente.",
    "Não foi possível copiar. Selecione o texto e copie manualmente.",
  ],
};

const sharedSnippet = (text: string): Record<InterfaceLocale, string> => ({
  en: text,
  es: text,
  "pt-BR": text,
});
export const agentSnippets: Record<string, Record<InterfaceLocale, string>> = {
  setup: sharedSnippet("node scripts/setup.mjs"),
  "codex-install": sharedSnippet(
    "codex plugin marketplace add Hensell/hen-screenshots\ncodex plugin add hen-screenshots@hen-screenshots",
  ),
  "claude-install": sharedSnippet(
    "/plugin marketplace add Hensell/hen-screenshots\n/plugin install hen-screenshots@hen-screenshots",
  ),
  "claude-load": sharedSnippet('claude --plugin-dir "PLUGIN_FOLDER"'),
  codex: {
    en: 'Read "PLUGIN_FOLDER/skills/create-screenshots/SKILL.md" and use its local CLI.\n\nCreate a three-slide Google Play series from the screenshots in "CAPTURES_FOLDER". Choose a dark template, use concise English captions based on the app’s actual features, and export to a new folder named launch-v1. Show me preview.png and save an editable .henscreenshots project.',
    es: 'Lee "PLUGIN_FOLDER/skills/create-screenshots/SKILL.md" y usa su CLI local.\n\nCrea una serie de tres slides para Google Play con las capturas de "CAPTURES_FOLDER". Elige una plantilla oscura, escribe textos breves en español basados en las funciones reales de la app y exporta a una carpeta nueva llamada launch-v1. Muéstrame preview.png y guarda un proyecto .henscreenshots editable.',
    "pt-BR":
      'Leia "PLUGIN_FOLDER/skills/create-screenshots/SKILL.md" e use a CLI local.\n\nCrie uma série de três slides para o Google Play com as capturas de "CAPTURES_FOLDER". Escolha um modelo escuro, escreva textos curtos em português com base nas funções reais do app e exporte para uma pasta nova chamada launch-v1. Mostre preview.png e salve um projeto .henscreenshots editável.',
  },
  claude: {
    en: '/hen-screenshots:create-screenshots\n\nUse the screenshots in "CAPTURES_FOLDER" to create an iPhone App Store series. Choose a current supported export profile and a warm, minimal template. Write short English captions, export to a new folder named iphone-launch-v1, and show me the preview and editable project.',
    es: '/hen-screenshots:create-screenshots\n\nUsa las capturas de "CAPTURES_FOLDER" para crear una serie de iPhone para la App Store. Elige un perfil de exportación compatible y una plantilla cálida y minimalista. Escribe textos breves en español, exporta a una carpeta nueva llamada iphone-launch-v1 y muéstrame la vista previa y el proyecto editable.',
    "pt-BR":
      '/hen-screenshots:create-screenshots\n\nUse as capturas de "CAPTURES_FOLDER" para criar uma série de iPhone para a App Store. Escolha um perfil de exportação compatível e um modelo acolhedor e minimalista. Escreva textos curtos em português, exporte para uma pasta nova chamada iphone-launch-v1 e mostre a prévia e o projeto editável.',
  },
  portfolio: {
    en: 'Use Hen Screenshots to make a landscape portfolio composition with my desktop capture "desktop.png" and mobile capture "mobile.png". Find a template that combines both devices. Use a cream background, dark text, and the headline "Your day, in one place." Save the preview and editable project in a new folder named portfolio-v1.',
    es: 'Usa Hen Screenshots para crear una composición horizontal para mi portafolio con la captura de escritorio "desktop.png" y la de móvil "mobile.png". Busca una plantilla que combine ambos dispositivos. Usa un fondo crema, texto oscuro y el título "Tu día, en un solo lugar." Guarda la vista previa y el proyecto editable en una carpeta nueva llamada portfolio-v1.',
    "pt-BR":
      'Use o Hen Screenshots para criar uma composição horizontal para meu portfólio com a captura de desktop "desktop.png" e a de celular "mobile.png". Encontre um modelo que combine os dois dispositivos. Use fundo creme, texto escuro e o título "Seu dia, em um só lugar." Salve a prévia e o projeto editável em uma pasta nova chamada portfolio-v1.',
  },
  languages: {
    en: "Create English, Spanish, and Brazilian Portuguese versions of the series we just designed. Keep the layout linked and adapt the captions naturally to each language. Export a folder per language to a new directory named launch-translated-v1, and show me every preview so I can check for text overflow.",
    es: "Crea versiones en inglés, español y portugués de Brasil de la serie que acabamos de diseñar. Mantén el diseño vinculado y adapta los textos de forma natural a cada idioma. Exporta una carpeta por idioma dentro de una carpeta nueva llamada launch-translated-v1 y muéstrame todas las vistas previas para comprobar que el texto cabe bien.",
    "pt-BR":
      "Crie versões em inglês, espanhol e português do Brasil da série que acabamos de criar. Mantenha o design vinculado e adapte os textos de forma natural a cada idioma. Exporte uma pasta por idioma dentro de uma pasta nova chamada launch-translated-v1 e mostre todas as prévias para conferir se o texto cabe bem.",
  },
};
