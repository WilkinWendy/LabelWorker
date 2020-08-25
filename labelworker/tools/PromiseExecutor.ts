export type PromiseExecutorMainRejectFunc = (reason?: any) => void;
export type PromiseExecutorMainResolveFunc<T> = (result: T) => void;
export type PromiseExecutorMainFinallyFunc = () => void;

export type PromiseExecutorMainFunc<T> = (
  resolve: PromiseExecutorMainResolveFunc<T>,
  reject: PromiseExecutorMainRejectFunc
) => void;

export type PromiseExecutorOnCancelFunc = (reason?: any) => void;

/**
 * 一种方便操作的promise控制器（可取消的promise）,适合正常流程是由自身控制结束的场景使用
 */
export class PromiseExecutor<T> {
  private mainFunc!: PromiseExecutorMainFunc<T>;
  private onCancelFunc!: PromiseExecutorOnCancelFunc;
  private reject!: PromiseExecutorMainRejectFunc;
  private onFinallyFunc!: PromiseExecutorMainFinallyFunc;

  private isDone: boolean = false;
  /**
   * 一种方便操作的promise控制器（可取消的promise）
   * 1. promise执行正常，正常返回
   * 2. promise执行内部异常情况，终止执行，reject返回，执行取消回调函数
   * 3. 外部取消promise情况，终止执行，reject返回，执行取消回调函数
   * @param mainFunc 业务promise逻辑函数
   * @param onCancelFunc 取消回调函数
   * @param onFinallyFunc finally函数
   */
  constructor(
    mainFunc: PromiseExecutorMainFunc<T>,
    onCancelFunc: PromiseExecutorOnCancelFunc,
    onFinallyFunc?: PromiseExecutorMainFinallyFunc
  ) {
    this.mainFunc = mainFunc
    this.onCancelFunc = onCancelFunc
    if (onFinallyFunc) {
      this.onFinallyFunc = onFinallyFunc
    }
  }

  name: string = '未命名action';

  getResult(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // 将内部reject方法外置，以使外部拥有reject能力
      this.reject = reject
      const innerP = new Promise(this.mainFunc)
      innerP.then(
        res => {
          if (!this.isDone) {
            resolve(res)
            this.onFinallyFunc()
          }
          this.isDone = true
        },
        reason => {
          if (!this.isDone) {
            console.dir(reason)
            this.onCancelFunc(reason)
            this.onFinallyFunc()
            reject(reason)
          }
          this.isDone = true
        }
      )
    })
  }

  dispose(reason?: string) {
    if (!this.reject) {
      console.log(
        'dispose Function should be call after getResult Function calls'
      )
      return
    }
    if (!this.isDone) {
      this.onCancelFunc(reason)
      this.onFinallyFunc()
      this.reject(reason ?? `用户终止${this.name}未指定原因`)
    }

    this.isDone = true
  }
}

// export interface PromiseExecutorInterface {
//   getResult(): Promise<T>
// }
