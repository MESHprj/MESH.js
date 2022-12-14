import { Base } from './Base';

export class Move extends Base {
  /**
   * Tapped event
   */
  public onTapped: ((accele: Move['accele']) => void) | null = null;
  /**
   * Shaked event
   */
  public onShaked: ((accele: Move['accele']) => void) | null = null;
  /**
   * Flipped event
   */
  public onFlipped: ((accele: Move['accele']) => void) | null = null;
  /**
   * Orientation changed event
   */
  public onOrientationChanged:
    | ((face: number, accele: Move['accele']) => void)
    | null = null;

  protected accele = { x: 0, y: 0, z: 0 };

  // Constant Values
  private readonly TYPE_INDEX_: number = 1 as const;
  private readonly MESSAGE_TYPE_ID_: number = 1 as const;
  private readonly DATA_LENGTH_ = 17 as const;
  private readonly TAP_EVENT_ID_ = 0 as const;
  private readonly SHAKE_EVENT_ID_ = 1 as const;
  private readonly FLIP_EVENT_ID_ = 2 as const;
  private readonly ORIENTATION_EVENT_ID_ = 3 as const;

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
      ? name?.indexOf('MESH-100AC') !== -1
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

    // update accele values
    const BYTE = 256 as const;
    const BASE = 1024 as const;
    this.accele.x = this.complemnt(BYTE * data[5] + data[4]) / BASE;
    this.accele.y = this.complemnt(BYTE * data[7] + data[6]) / BASE;
    this.accele.z = this.complemnt(BYTE * data[9] + data[8]) / BASE;

    // emit event
    switch (data[this.TYPE_INDEX_]) {
      case this.TAP_EVENT_ID_:
        if (typeof this.onTapped === 'function') {
          this.onTapped(this.accele);
        }
        break;
      case this.SHAKE_EVENT_ID_:
        if (typeof this.onShaked === 'function') {
          this.onShaked(this.accele);
        }
        break;
      case this.FLIP_EVENT_ID_:
        if (typeof this.onFlipped === 'function') {
          this.onFlipped(this.accele);
        }
        break;
      case this.ORIENTATION_EVENT_ID_:
        if (typeof this.onOrientationChanged === 'function') {
          const face = data[2];
          this.onOrientationChanged(face, this.accele);
        }
        break;
      default:
        break;
    }
  }
}
