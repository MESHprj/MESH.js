import { MESHJsBlockVersionError, MESHJsOutOfRangeError } from '../util/Error';

export class Base {
  /**
   * Battery level event
   */
  public onBatteryLevel: ((battery: number) => void) | null = null;
  /**
   * Status button pressed event
   */
  public onStatusButtonPressed: (() => void) | null = null;

  // Constant Values
  public readonly UUIDS = {
    SERVICE_ID: '72c9000157a94d40b746534e22ec9f9e' as const,
    CHARACTERISTICS: {
      INDICATE: '72c9000557a94d40b746534e22ec9f9e' as const,
      NOTIFY: '72c9000357a94d40b746534e22ec9f9e' as const,
      WRITE: '72c9000457a94d40b746534e22ec9f9e' as const,
      WRITE_WO_RESPONSE: '72c9000257a94d40b746534e22ec9f9e' as const,
    } as const,
  } as const;
  protected readonly MESSAGE_TYPE_ID_INDEX = 0 as const;
  protected readonly EVENT_TYPE_ID_INDEX = 1 as const;
  private readonly FEATURE_COMMAND_ = [
    0 as const,
    2 as const,
    1 as const,
    3 as const,
  ];
  private readonly MESSAGE_TYPE_ID_VALUE_ = 0 as const;
  private readonly INDICATE_EVENT_TYPE_ID_VALUE_ = 2 as const;
  private readonly INDICATE_LENGTH_ = 16 as const;
  private readonly INDICATE_VERSION_MAJOR_INDEX_ = 7 as const;
  private readonly INDICATE_VERSION_MINOR_INDEX_ = 8 as const;
  private readonly INDICATE_VERSION_RELEASE_INDEX_ = 9 as const;
  private readonly INDICATE_BATTERY_INDEX_ = 14 as const;
  private readonly REGULARLY_EVENT_TYPE_ID_VALUE_ = 0 as const;
  private readonly REGULARLY_LENGTH_ = 4 as const;
  private readonly REGULARLY_BATTERY_INDEX_ = 2 as const;
  private readonly STATUSBUTTON_PRESSED_EVENT_TYPE_ID_VALUE_ = 1 as const;
  private readonly STATUSBUTTON_PRESSED_LENGTH_ = 4 as const;
  private readonly STATUSBAR_LED_EVENT_TYPE_ID_VALUE_ = 0 as const;

  private versionMajor_ = -1;
  private versionMinor_ = -1;
  private versionRelease_ = -1;
  private battery_ = -1;

  /**
   * Get command of feature behavior
   */
  public get featureCommand(): number[] {
    return this.FEATURE_COMMAND_;
  }

  /**
   * Get battery level
   */
  public get battery(): number {
    return this.battery_;
  }

  /**
   * Verify that the device is MESH block
   *
   * @param name
   * @param opt_serialnumber
   * @returns
   */
  public static isMESHblock(
    name: string | null,
    opt_serialnumber = ''
  ): boolean {
    if (!name) {
      return false;
    }
    const LOCAL_NAME_LENGTH = 17 as const;
    if (name.length !== LOCAL_NAME_LENGTH) {
      return false;
    }
    if (name.indexOf('MESH-100') === -1) {
      return false;
    }
    if (opt_serialnumber !== '' && name.indexOf(opt_serialnumber) === -1) {
      return false;
    }
    return true;
  }

  /**
   * Set result of indicate
   *
   * @param data
   * @returns void
   */
  public indicate(data: number[]): void {
    if (data.length !== this.INDICATE_LENGTH_) {
      return;
    }
    if (data[this.MESSAGE_TYPE_ID_INDEX] !== this.MESSAGE_TYPE_ID_VALUE_) {
      return;
    }
    if (data[this.EVENT_TYPE_ID_INDEX] !== this.INDICATE_EVENT_TYPE_ID_VALUE_) {
      return;
    }
    this.battery_ = data[this.INDICATE_BATTERY_INDEX_];
    this.versionMajor_ = data[this.INDICATE_VERSION_MAJOR_INDEX_];
    this.versionMinor_ = data[this.INDICATE_VERSION_MINOR_INDEX_];
    this.versionRelease_ = data[this.INDICATE_VERSION_RELEASE_INDEX_];
  }

  /**
   * notify
   *
   * @param data
   */
  public notify(data: number[]): void {
    this.updateBattery_(data);
    this.updateStatusButton_(data);
  }

  /**
   * Create command of statusbar LED
   *
   * @param power
   * @param red
   * @param green
   * @param blue
   * @returns command
   */
  public createStatusbarLedCommand(
    power: boolean,
    red: boolean,
    green: boolean,
    blue: boolean
  ): number[] {
    const data = [
      this.MESSAGE_TYPE_ID_VALUE_,
      this.STATUSBAR_LED_EVENT_TYPE_ID_VALUE_,
      Number(red),
      Number(green),
      Number(blue),
      Number(power),
    ];
    data.push(this.checkSum(data));
    return data;
  }

  /**
   * Check software version of MESH block
   *
   * @returns
   */
  public checkVersion() {
    const VERSION_MAJOR = 1;
    const VERSION_MINOR = 2;
    const VERSION_RELEASE = 5;
    if (VERSION_MAJOR < this.versionMajor_) {
      return true;
    }
    if (this.versionMajor_ < VERSION_MAJOR) {
      throw new MESHJsBlockVersionError(
        this.versionMajor_,
        this.versionMinor_,
        this.versionRelease_
      );
    }
    if (VERSION_MINOR < this.versionMinor_) {
      return true;
    }
    if (this.versionMinor_ < VERSION_MINOR) {
      throw new MESHJsBlockVersionError(
        this.versionMajor_,
        this.versionMinor_,
        this.versionRelease_
      );
    }
    if (VERSION_RELEASE < this.versionRelease_) {
      return true;
    }
    if (this.versionRelease_ < VERSION_RELEASE) {
      throw new MESHJsBlockVersionError(
        this.versionMajor_,
        this.versionMinor_,
        this.versionRelease_
      );
    }
    return true;
  }

  protected checkSum(command: number[]): number {
    let sum = 0;
    command.forEach((val) => {
      sum += val;
    });
    const BYTE = 256 as const;
    return sum % BYTE;
  }

  protected checkRange(
    target: number,
    min: number,
    max: number,
    name: string
  ): boolean {
    if (target < min || max < target) {
      throw new MESHJsOutOfRangeError(name, min, max);
    }
    return true;
  }

  protected complemnt(val: number): number {
    const TWO_BYTE_PLUS1 = 65536 as const; // 0x10000
    const TWO_BYTE_HALF = Math.floor(TWO_BYTE_PLUS1 / 2) - 1;
    return val - (val > TWO_BYTE_HALF ? TWO_BYTE_PLUS1 : 0);
  }

  protected invcomplemnt(val: number): number {
    const TWO_BYTE_PLUS1 = 65536 as const; // 0x10000
    return val + (val < 0 ? TWO_BYTE_PLUS1 : 0);
  }

  private updateBattery_(data: number[]): boolean {
    if (data.length !== this.REGULARLY_LENGTH_) {
      return false;
    }
    if (data[this.MESSAGE_TYPE_ID_INDEX] !== this.MESSAGE_TYPE_ID_VALUE_) {
      return false;
    }
    if (
      data[this.EVENT_TYPE_ID_INDEX] !== this.REGULARLY_EVENT_TYPE_ID_VALUE_
    ) {
      return false;
    }
    this.battery_ = data[this.REGULARLY_BATTERY_INDEX_];
    if (typeof this.onBatteryLevel !== 'function') {
      return false;
    }
    this.onBatteryLevel(this.battery_);
    return true;
  }

  private updateStatusButton_(data: number[]): boolean {
    if (data.length !== this.STATUSBUTTON_PRESSED_LENGTH_) {
      return false;
    }
    if (data[this.MESSAGE_TYPE_ID_INDEX] !== this.MESSAGE_TYPE_ID_VALUE_) {
      return false;
    }
    if (
      data[this.EVENT_TYPE_ID_INDEX] !==
      this.STATUSBUTTON_PRESSED_EVENT_TYPE_ID_VALUE_
    ) {
      return false;
    }
    if (data[2] !== 0) {
      return false;
    }
    if (typeof this.onStatusButtonPressed !== 'function') {
      return false;
    }
    this.onStatusButtonPressed();
    return true;
  }
}
