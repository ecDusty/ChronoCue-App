// English — the source of truth and runtime fallback. Every other language pack
// is typed against these keys, so a missing key fails the TypeScript build.
export const en = {
  // Mode toggle
  'mode.simple': 'Timer',
  'mode.agenda': 'Agenda',

  // Controls
  'controls.start': 'Start',
  'controls.pause': 'Pause',
  'controls.resume': 'Resume',
  'controls.reset': 'Reset',
  'controls.clear': 'Clear',
  'controls.prev': 'Prev',
  'controls.next': 'Next',
  'controls.startAgenda': 'Start Agenda',
  'controls.createAgenda': 'Create Agenda',
  'controls.noAgendaItems': 'No agenda items yet',

  // Common
  'common.on': 'On',
  'common.off': 'Off',
  'common.remove': 'Remove',
  'unit.h': 'hr',
  'unit.min': 'min',
  'unit.sec': 's',

  // Settings panel
  'settings.title': 'Settings',
  'settings.titleSimple': 'Timer Settings',
  'settings.titleAgenda': 'Agenda Settings',
  'settings.timerSize': 'Timer Size',
  'settings.size.small': 'Small — compact display',
  'settings.size.medium': 'Medium — balanced display',
  'settings.size.large': 'Large — fills most of the screen',
  'settings.size.xlarge': 'Extra Large — maximum visibility',
  'settings.fontFamily': 'Font Family',
  'settings.fontDefault': 'Default',
  'settings.bgColor': 'Background Color',
  'settings.bgImage': 'Background Image',
  'settings.uploadImage': 'Upload Image',
  'settings.changeImage': 'Change Image',
  'settings.fontColor': 'Timer Font Color',
  'settings.gongSound': 'Gong Sound',
  'settings.gongSoundDesc': 'Play a sound when timer ends',
  'settings.fadeEffect': 'Fade Effect',
  'settings.fadeEffectDesc': 'Timer fades in/out when ended',
  'settings.overTime': 'Over Time',
  'settings.overTimeDesc': 'Show how much over time after timer ends',

  // Sound selector
  'sound.defaultGong': 'Default Gong',
  'sound.upload': 'Upload sound',
  'sound.removeTitle': 'Remove this sound from the library',

  // Agenda editor
  'agenda.editTitle': 'Edit Agenda',
  'agenda.settingsButton': 'Agenda Settings',
  'agenda.itemName': 'Item name',
  'agenda.hr': 'Hr',
  'agenda.min': 'Min',
  'agenda.sec': 'Sec',
  'agenda.perItemSettings': 'Per-item settings',
  'agenda.addItem': '+ Add Item',
  'agenda.import': 'Import',
  'agenda.importing': 'Importing…',
  'agenda.importTitle': 'Import items from a spreadsheet (column A = name, B = duration). Replaces the current list.',
  'agenda.minTotal': '{minutes} min total',
  'agenda.save': 'Save',
  'agenda.discard': 'Discard',
  'agenda.showOvertime': 'Show overtime',
  'agenda.fadeBlink': 'Fade / blink',
  'agenda.gong': 'Gong',
  'agenda.usingGlobal': 'Using global ({state})',
  'agenda.importErrorNoRows': 'No valid rows found — use column A = name, column B = duration.',
  'agenda.importErrorRead': 'Could not read that file. Supported types: .xlsx, .xls, .csv',

  // Agenda progress bar
  'agendaProgress.itemFallback': 'Item {number}',
  'agendaProgress.next': 'Next: {name} — {duration}',

  // Mode-switch confirmation
  'modeSwitch.title': 'Switch timer mode?',
  'modeSwitch.body': 'Switching modes pauses the current timer. It stays paused until you switch back and resume it.',
  'modeSwitch.dontShowAgain': "Don't show this again",
  'modeSwitch.cancel': 'Cancel',
  'modeSwitch.continue': 'Continue',

  // Time input
  'timeInput.setTimer': 'Set Timer',
  'timeInput.set': 'Set',
  'timeInput.hr': 'Hr',
  'timeInput.min': 'Min',
  'timeInput.sec': 'Sec',

  // Restore-session prompt
  'restore.title': 'Continue where you left off?',
  'restore.body': 'Your previous timer and agenda were saved.',
  'restore.continue': 'Continue',
  'restore.startFresh': 'Start fresh',

  // Language selector
  'language.label': 'Language',
} as const

export default en
