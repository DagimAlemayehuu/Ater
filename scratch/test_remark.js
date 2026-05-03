import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'

const file = unified()
  .use(remarkParse)
  .use(remarkMath)
  .parse('Given a sequence $a_n$ and $c_0$')

console.log(JSON.stringify(file, null, 2))
