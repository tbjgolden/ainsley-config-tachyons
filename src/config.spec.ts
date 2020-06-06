import { Ainsley, validate, generate, minify, flatten } from 'ainsley'
import { parse } from 'css-tree'
import { config, options } from './config'

describe('config tests', () => {
  let flatConfig: Promise<Ainsley> = new Promise(() => {
    /* */
  })

  test('flattens without throwing', async () => {
    expect(async () => {
      flatConfig = flatten(config)
      await flatConfig
    }).not.toThrow()
    expect(flatConfig).not.toBe(null)
  })

  test('generates without throwing', async () => {
    expect(async () => {
      generate(await flatConfig, options)
    }).not.toThrow()
    expect(generate(await flatConfig, options)).not.toBe('')
  })

  // not applicable if not including some co-dependent options
  test('no invalid css nodes when parsed with associated options', async () => {
    expect(getErrors(generate(await flatConfig, options))).toEqual([])
  })

  // checks the structure of the config itself
  test('is valid according to validate', async () => {
    expect(validate(await flatConfig)).toEqual([])
  })

  // variables without modifiers makes your config less flexible
  test.skip('no variables without modifiers', async () => {
    expect(getUnmoddedVariables(await flatConfig)).toEqual([])
  })

  // minify succeeds
  test('minifies successfully', async () => {
    expect(async () => minify(await flatConfig)).not.toThrow()
  })
})

const getErrors = (css: string): string[] => {
  const invalid = [] as string[]

  try {
    parse(css, {
      positions: true,
      onParseError: (e, node) => {
        let message = e.message
        if ('value' in node) message += `: ${node.value}`

        if (invalid.length < 10) {
          invalid.push(message)
        } else if (invalid.length === 10) {
          invalid.push('...')
        }
      }
    })
  } catch (e) {
    invalid.push(e.message)
  }

  return invalid
}

const getUnmoddedVariables = (config: Ainsley): string[] => {
  const unmodded = [] as string[]

  const toCheck = [config]
  while (toCheck.length > 0) {
    const config = toCheck[toCheck.length - 1]

    if (config.variables !== null && typeof config.variables === 'object') {
      for (const variable of Object.keys(config.variables)) {
        if (
          variable.length === 0 ||
          !(variable[0].startsWith('+') || variable[0].startsWith('?'))
        ) {
          if (length > 10) {
            unmodded.push('...')
            return unmodded
          } else {
            unmodded.push(variable)
          }
        }
      }
    }

    toCheck.pop()

    if (Array.isArray(config.children)) {
      toCheck.push(
        ...(config.children.filter(
          (child) =>
            !Array.isArray(child) && child !== null && typeof child === 'object'
        ) as Ainsley[])
      )
    }
  }

  return unmodded
}
