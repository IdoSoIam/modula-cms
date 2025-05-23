/** @type {import('tailwindcss').Config} */
module.exports = {
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        campeyrigoux: {
          primary: '#6B8E23', // vert olive (boutons)
          secondary: '#1EB2A6', // turquoise
          accent: '#D1452E', // rouge orangé
          neutral: '#2F4858', // bleu foncé
          'base-100': '#ffffff',
          info: '#38BDF8',
          success: '#22C55E',
          warning: '#FACC15',
          error: '#EF4444'
        }
      }
    ],
    darkTheme: 'campeyrigoux',
  }
};
