import { Base } from './Base';

export class Button extends Base {
  /**
   * Single pressed event
   */
  public onSinglePressed: (() => void) | null = null;
  /**
   * Long pressed event
   */
  public onLongPressed: (() => void) | null = null;
  /**
   * Double pressed event
   */
  public onDoublePressed: (() => void) | null = null;

  // Constant Values
  private readonly DATA_LENGTH_: number = 4 as const;
  private readonly TYPE_INDEX_: number = 2 as const;
  private readonly MESSAGE_TYPE_ID_: number = 1 as const;
  private readonly EVENT_TYPE_ID_: number = 0 as const;
  private readonly TYPE_ = {
    SINGLE: 1 as const,
    LONG: 2 as const,
    DOUBLE: 3 as const,
  } as const;

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
    return super.isMESHblock(name, opt_serialnumber)
      ? name?.indexOf('MESH-100BU') !== -1
      : false;
  }

  /**
   * Parse data that received from MESH block, and emit event
   *
   * @param data
   * @returns
   */
  public notify(data: number[]): void {
    super.notify(data);
    if (data.length !== this.DATA_LENGTH_) {
      return;
    }
    if (data[this.MESSAGE_TYPE_ID_INDEX] !== this.MESSAGE_TYPE_ID_) {
      return;
    }
    if (data[this.EVENT_TYPE_ID_INDEX] !== this.EVENT_TYPE_ID_) {
      return;
    }
    switch (data[this.TYPE_INDEX_]) {
      case this.TYPE_.SINGLE:
        if (typeof this.onSinglePressed === 'function') {
          this.onSinglePressed();
        }
        break;
      case this.TYPE_.LONG:
        if (typeof this.onLongPressed === 'function') {
          this.onLongPressed();
        }
        break;
      case this.TYPE_.DOUBLE:
        if (typeof this.onDoublePressed === 'function') {
          this.onDoublePressed();
        }
        break;
      default:
        break;
    }
  }
}
