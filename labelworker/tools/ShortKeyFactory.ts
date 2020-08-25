import { Subject, pipe, Observable, timer } from 'rxjs'
import { debounceTime, throttle, throttleTime, debounce } from 'rxjs/operators'
import {
  isKeyDownOnly,
  isKeyDownWithOnlyShift,
  isKeyDownWithOnlyCtrl,
  isKeyDown,
  isKeyDownWithOnlyAlt
} from './eventJudge'
import { KonvaEventObject } from 'konva/types/Node'

export interface ShortKeyFactoryConfig {
  // 延迟毫秒数
  debounceDelay: number;
}

export interface ShortKeyFactoryKeyUnit {
  shortKey: string;
  name: string;
}

export interface FrequentEventBus {
  meta: ShortKeyFactoryKeyUnit;
  /**
   * ctrl+key
   */
  ctrlSubject: Observable<void>;
  /**
   * alt+key
   */
  altSubject: Observable<void>;
  /**
   * shift+key
   */
  shiftSubject: Observable<void>;
  /**
   * key
   */
  keySubject: Observable<void>;
}

interface InnerFrequentEventBus extends FrequentEventBus {
  _ctrlSubject: Subject<void>;
  _shiftSubject: Subject<void>;
  _keySubject: Subject<void>;
  _altSubject: Subject<void>;
}

export class ShortKeyFactory {
  constructor(config?: ShortKeyFactoryConfig) {
    this._config = config
  }

  private _baseSubject: Subject<InnerSubjectParams> = new Subject<
    InnerSubjectParams
  >();
  private _baseKeyDownEvent: (e: KeyboardEvent) => void = e => {};

  private _config?: ShortKeyFactoryConfig;

  private _eventBusArr: InnerFrequentEventBus[] = [];

  private _isListening: boolean = false;

  public getDebounceDelay(): number {
    return this._config?.debounceDelay ?? 100
  }

  /**
   * 先注册
   * @param keyUnits
   */
  registerKeys(keyUnits: ShortKeyFactoryKeyUnit[]) {
    // this.disable()
    // this._baseSubject.unsubscribe()
    // this._removeCurrentKeys() // 暂时似乎不需要
    this._baseSubject = new Subject()
    const createtime = Date.now()
    console.log(createtime, '注册了shortKeys', keyUnits)
    this._eventBusArr = keyUnits.map(item => {
      const ctrlSubject = new Subject<void>()
      const shiftSubject = new Subject<void>()
      const keySubject = new Subject<void>()
      const altSubject = new Subject<void>()

      const item2 = {
        meta: item,
        _ctrlSubject: ctrlSubject,
        _shiftSubject: shiftSubject,
        _keySubject: keySubject,
        _altSubject: altSubject,
        ctrlSubject: ctrlSubject.pipe(
          debounce(() => timer(this.getDebounceDelay()))
        ),
        shiftSubject: shiftSubject.pipe(
          debounce(() => timer(this.getDebounceDelay()))
        ),
        keySubject: keySubject.pipe(
          debounce(() => timer(this.getDebounceDelay()))
        ),
        altSubject: altSubject.pipe(
          debounce(() => timer(this.getDebounceDelay()))
        )
      }

      const { meta: { shortKey }, _keySubject, _ctrlSubject, _shiftSubject, _altSubject } = item2

      this._baseSubject.subscribe(({ e }) => {
        if (!isKeyDown(shortKey, e)) return
        // console.log('shortKeyFactoryDebug', shortKey, e)
        if (isKeyDownOnly(shortKey, e)) {
          _keySubject.next()
          console.log(createtime, shortKey)
          e.returnValue = false
          e.preventDefault()
        }
        if (isKeyDownWithOnlyCtrl(shortKey, e)) {
          _ctrlSubject.next()
          console.log(createtime, shortKey, 'ctrl')
          e.returnValue = false
          e.preventDefault()
        }
        if (isKeyDownWithOnlyShift(shortKey, e)) {
          _shiftSubject.next()
          console.log(createtime, shortKey, 'shift')
          e.returnValue = false
          e.preventDefault()
        }
        if (isKeyDownWithOnlyAlt(shortKey, e)) {
          _altSubject.next()
          console.log(createtime, shortKey, 'alt')
          e.returnValue = false
          e.preventDefault()
        }
      })

      return item2
    })
  }

  _removeCurrentKeys() {
    this._eventBusArr.forEach(item => {
      item._altSubject.unsubscribe()
      item._keySubject.unsubscribe()
      item._shiftSubject.unsubscribe()
      item._ctrlSubject.unsubscribe()
    })
  }

  /**
   * 再获得外部bus
   */
  getBus(): FrequentEventBus[] {
    return this._eventBusArr.map(
      ({ meta, ctrlSubject, keySubject, shiftSubject, altSubject }) => {
        return { meta, ctrlSubject, keySubject, shiftSubject, altSubject }
      }
    )
  }

  /**
   * 启用
   */
  enable() {
    if (this._isListening) {
      return
    }
    console.log('快捷键已开启')
    window.addEventListener(
      'keyup',
      (this._baseKeyDownEvent = e => {
        this._baseSubject.next({ e })
      })
    )
    this._isListening = true
  }

  /**
   * 禁用
   */
  disable() {
    if (!this._isListening) {
      return
    }
    console.log('快捷键已禁用')
    window.removeEventListener('keyup', this._baseKeyDownEvent)
    this._isListening = false
  }
}

interface InnerSubjectParams {
  e: KeyboardEvent;
}
