import { Color } from "./Color";

/** Collection of default colors */
export abstract class Colors {
    static red: Color;
    static lime: Color;
    static blue: Color;
    static yellow: Color;
    static fuchsia: Color;
    static cyan: Color;
    static white: Color;
    static gray: Color;
    static black: Color;
    static maroon: Color;
    static navy: Color;
    static green: Color;
}

Colors.red = new Color("#ee1111");
Colors.lime = new Color("#11ee11");
Colors.blue = new Color("#1111ee");
Colors.yellow = new Color("#eeee11");
Colors.fuchsia = new Color("#ee11ee");
Colors.cyan = new Color("#11eeee");
Colors.white = new Color("#fafafa");
Colors.gray = new Color("#808080");
Colors.black = new Color("#0a0a0a");
Colors.maroon = new Color("#661111");
Colors.navy = new Color("#111166");
Colors.green = new Color("#118811");