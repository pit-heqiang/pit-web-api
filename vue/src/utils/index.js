export const smallTurnHump = (str) => {
  const reg = new RegExp('(/)' + '(.)', 'g')
  // 空格后面的第一个字符转成大写
  str = str.replace(reg, function (a, b, c) {
    return b + c.toUpperCase()
  })
  // 去除其它的特殊字符
  const res = /[^\u4e00-\u9fa5a-zA-Z0-9]/g
  str = str.replace(res, '')
  // 第一个字符转小写
  str = firstCapitalizeTurnSmall(str)
  return str
}

export const firstCapitalizeTurnSmall = (str) => {
  let newStr = ''
  for (var i = 0; i < str.length; i++) {
    if (i === 0) {
      newStr += str[i][0].toLowerCase()
    } else {
      newStr += str[i]
    }
  }
  return newStr
}

export const matchStr = (str) => {
  const match = str.lastIndexOf('-')
  return str.slice(match + 1)
}

export const handleParameter = (str) => {
  var regex = /\{(.+?)\}/g
  const arr = str.match(regex)
  const result = []
  console.log(arr)
  arr.forEach(item => {
    item = item.substr(1)
    item = item.substr(0, item.length - 1)
    result.push(item)
  })
  return result.join(', ')
}

export const sortUp = (x, y) => {
  return x.data.path - y.data.path
}

export const repeatElement = (arr) => {
  var re = []
  for (var i = 0; i < arr.length; i++) {
    var sum = 0
    for (var j = i; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        sum++
      }
    }
    if (sum !== 0) { // 如果有重复的元素
      if (re.length === 0) { // 第一次找到重复元素
        re.push(arr[i])
        re.push(sum)
      } else {
        if (Number(re[1]) < sum) { // 比较重复次数
          re[0] = arr[i]
          re[1] = sum
        }
      }
    }
  }
  return re
}
