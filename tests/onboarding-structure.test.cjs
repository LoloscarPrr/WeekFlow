const fs = require('fs');

const layout = fs.readFileSync('app/_layout.tsx', 'utf8');
const screen = fs.readFileSync('app/onboarding.tsx', 'utf8');
const persistence = fs.readFileSync('src/onboarding/persistence.ts', 'utf8');

function ok(value, message) {
  if (!value) throw new Error(message);
}

ok(layout.includes("shouldShowOnboarding"), 'RootLayout debe evaluar onboarding');
ok(layout.includes("router.replace('/onboarding')"), 'RootLayout debe redirigir instalaciones nuevas');
ok(layout.includes("onboardingRequired !== false"), 'recordatorios deben esperar resolución del onboarding');
ok(layout.includes("pathname !== '/onboarding'"), 'BottomNav debe ocultarse durante onboarding');

ok(screen.includes('Tu semana. Tu ritmo. Tu equilibrio.'), 'onboarding conserva identidad WeekFlow');
ok(screen.includes('Configurar mi semana'), 'onboarding ofrece Semana como siguiente paso');
ok(screen.includes('Entrar a WeekFlow'), 'onboarding permite continuar sin configurar ahora');
ok(screen.includes('No necesitas crear una cuenta'), 'cuenta no puede ser muro de entrada');
ok(!screen.includes('requestPermissionsAsync'), 'onboarding no debe pedir permisos de notificación');

ok(persistence.includes("ONBOARDING_STATE_KEY = 'onboarding-state'"), 'estado usa key/value existente');
ok(persistence.includes("loadMoveHistory().length"), 'migración reconoce uso Move');
ok(persistence.includes("loadFoodHistory().length"), 'migración reconoce uso Food');
ok(persistence.includes("loadHabitsState().habits.length"), 'migración reconoce hábitos');
ok(persistence.includes("saveUserProfile"), 'nombre reutiliza UserProfile existente');

console.log('Onboarding structure tests passed.');
