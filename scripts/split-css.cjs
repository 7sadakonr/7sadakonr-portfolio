const fs = require('fs');

const cssPath = 'src/pages/LandingPage.css';
const cssContent = fs.readFileSync(cssPath, 'utf8');
const lines = cssContent.split('\n');

const aboutStart = lines.findIndex(line => line.includes('ABOUT BENTO GRID SECTION'));
const projectsStart = lines.findIndex(line => line.includes('PROJECTS SECTION'));
const contactStart = lines.findIndex(line => line.includes('CONTACT SECTION'));

// The comment block starts 1 line before the matched text: /* =====...
const aboutSplit = aboutStart - 1;
const projectsSplit = projectsStart - 1;
const contactSplit = contactStart - 1;

const landingLines = lines.slice(0, aboutSplit);
const aboutLines = lines.slice(aboutSplit, projectsSplit);
const projectsLines = lines.slice(projectsSplit, contactSplit);
const contactLines = lines.slice(contactSplit);

fs.writeFileSync('src/pages/LandingPage.css', landingLines.join('\n'));
fs.writeFileSync('src/pages/AboutPage.css', aboutLines.join('\n'));
fs.writeFileSync('src/features/projects/ProjectPage.css', projectsLines.join('\n'));
fs.writeFileSync('src/features/contact/ContactPage.css', contactLines.join('\n'));
