const fs = require('fs');
const screen = fs.readFileSync('app/notifications.tsx', 'utf8');
const service = fs.readFileSync('src/services/notifications.ts', 'utf8');
const core = fs.readFileSync('src/notifications/core.ts', 'utf8');
const policy = fs.readFileSync('src/notifications/smartSilence.ts', 'utf8');

function ok(value, message) {
  if (!value) throw new Error(message);
}

ok(core.includes('smartSilence: boolean'), 'preferencias deben incluir smartSilence');
ok(screen.includes('Proteger mi descanso'), 'UI debe exponer protección');
ok(screen.includes('Próximo descanso protegido'), 'UI debe mostrar próxima ventana');
ok(screen.includes('no aprende ni cambia tus preferencias'), 'UI debe explicar que no hay IA opaca');
ok(policy.includes('protected-rest'), 'política debe identificar supresión por descanso');
ok(policy.includes("kind === 'important' || kind === 'departure' || kind === 'rest'"), 'prioridades explícitas deben conservarse');
ok(service.includes('interruptionDecision'), 'servicio debe aplicar política');
ok(service.includes('buildProtectedRestWindows'), 'servicio debe calcular ventanas');

console.log('Smart silence structure tests passed.');
