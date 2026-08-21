const fs = require('fs');
const path = require('path');

const files = [
    'src/Mechanic-Pages/MechanicDashboard.css',
    'src/PartsManager-Pages/PartsManagerDashboard.css',
    'src/Receptionist-Pages/ReceptionistDashboard.css',
    'src/Supervisor-Pages/SupervisorDashboard.css',
    'src/Receptionist-Pages/ReceptionistClientDetails.css'
];

const replacements = [
    // Backgrounds - general
    { regex: /background(-color)?:\s*(#ffffff|white)[;!]/gi, replacement: 'background: var(--charcoal);' },
    { regex: /background(-color)?:\s*#f8fafc[;!]/gi, replacement: 'background: var(--black);' },
    { regex: /background(-color)?:\s*#f9fafb[;!]/gi, replacement: 'background: var(--charcoal-light);' },
    { regex: /background(-color)?:\s*#f3f4f6[;!]/gi, replacement: 'background: var(--steel);' },
    { regex: /background(-color)?:\s*(#2563eb|#3b82f6)[;!]/gi, replacement: 'background: var(--red);' },
    { regex: /background(-color)?:\s*#1d4ed8[;!]/gi, replacement: 'background: var(--red-dark);' },
    // Text colors
    { regex: /color:\s*#111827[;!]/gi, replacement: 'color: var(--white);' },
    { regex: /color:\s*#374151[;!]/gi, replacement: 'color: var(--white);' },
    { regex: /color:\s*#6b7280[;!]/gi, replacement: 'color: var(--muted);' },
    { regex: /color:\s*(#2563eb|#3b82f6)[;!]/gi, replacement: 'color: var(--red);' },
    { regex: /color:\s*#0284c7[;!]/gi, replacement: 'color: var(--white);' }, // inside badge
    // Borders
    { regex: /border(-color)?:\s*#e5e7eb[;!]/gi, replacement: 'border-color: var(--border-light);' },
    { regex: /border(-color)?:\s*#f3f4f6[;!]/gi, replacement: 'border-color: var(--border);' },
    { regex: /border(-color)?:\s*#d1d5db[;!]/gi, replacement: 'border-color: var(--border-light);' },
    { regex: /1px solid (#[a-fA-F0-9]{3,6}|rgba?[^)]+\))/gi, replacement: '1px solid var(--border-light)' },
    // Shadows
    { regex: /box-shadow:\s*0[^;]+;/gi, replacement: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);' },
    // Specifically fix main page wrappers to be black
    { regex: /\.dashboard-container \{[^}]+\}/gi, match => match.replace(/var\(--charcoal\)/g, 'var(--black)') },
{ regex: /\.pm-container \{[^}]+\}/gi, match => match.replace(/var\(--charcoal\)/g, 'var(--black)') },
{ regex: /\.receptionist-dashboard \{[^}]+\}/gi, match => match.replace(/var\(--charcoal\)/g, 'var(--black)') },
{ regex: /\.client-details-page \{[^}]+\}/gi, match => match.replace(/var\(--charcoal\)/g, 'var(--black)') },
{ regex: /\.supervisor-dashboard \{[^}]+\}/gi, match => match.replace(/var\(--charcoal\)/g, 'var(--black)') },
];

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.log(\`Skip \${fullPath} mapping.\`);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');

    replacements.forEach(({ regex, replacement, match }) => {
        if (match) {
            content = content.replace(regex, match);
        } else {
            content = content.replace(regex, replacement);
        }
    });

    fs.writeFileSync(fullPath, content);
    console.log(\`✅ Processed \${file}\`);
});
