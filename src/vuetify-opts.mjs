import colors from 'vuetify/lib/util/colors.mjs'

let COLOR_SAFFRON = "#ff9933";

export default class VuetifyOpts {
  static get COLOR_SAFFRON() {
    return COLOR_SAFFRON;
  }

  static options() {
    return {
      theme: {
        defaultTheme: 'dark',
        themes: {
          light: VuetifyOpts.lightTheme(),
          dark: VuetifyOpts.darkTheme(),
        },
      },
    }
  } // options

  static lightTheme() {
    return {
      dark: false,
      colors: {
        background: colors.grey.lighten1,
        surface:"#f0f0f0",
        currentbg: "#ffffff",
        chip: colors.brown.darken2,
        link: colors.brown.darken2,
        toolbar: colors.brown.darken2,
        matched: "#bf235d",
        placeholder: "#600060",
        debug: "#00FFFF",
        expansion: colors.grey.lighten4,
        progress1: COLOR_SAFFRON,
        progress2: "#333333",
        audiobar: colors.brown.darken4,
        example: COLOR_SAFFRON,
        focus: COLOR_SAFFRON,
        alert: colors.red.darken4,
      },
    }
  } // lightTheme

  static darkTheme() {
    return {
      dark: true,
      colors: {
        background: "#121212",
        currentbg: "#000000",
        surface: "#222222",
        chip: COLOR_SAFFRON,
        link: COLOR_SAFFRON,
        matched: COLOR_SAFFRON,
        toolbar: colors.brown.darken2,
        placeholder: "#00FFFF",
        debug: "#00FFFF",
        expansion: colors.grey.darken2,
        progress1: COLOR_SAFFRON,
        progress2: "#ffffff",
        audiobar: colors.brown.darken4,
        example: COLOR_SAFFRON,
        focus: COLOR_SAFFRON,
        alert: colors.red.darken4,
      },
    }
  } // darkTheme

}

