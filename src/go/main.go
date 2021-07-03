package main

import (
  "flag"
  "fmt"
  "os"
  "strings"
)

func envVars(prefixes []string, escape *strings.Replacer) string {
  var sb strings.Builder
  sb.WriteString("{\n")
  for _, envPair := range os.Environ() {
    parts := strings.SplitN(envPair, "=", 2)
    if len(parts) != 2 || len(parts[0]) == 0 {
      continue
    }
    name := parts[0]
    value := parts[1]
    for _, prefix := range prefixes {
      if strings.HasPrefix(name, prefix) {
        sb.WriteString("  \"")
        sb.WriteString(escape.Replace(name))
        sb.WriteString("\": \"")
        sb.WriteString(escape.Replace(value))
        sb.WriteString("\",\n")
      }
    }
  }
  sb.WriteRune('}')
  return sb.String()
}

func jsonEscape() *strings.Replacer {
  return strings.NewReplacer(
    "\\", "\\\\",
    "\b", "\\b",
    "\f", "\\f",
    "\n", "\\n",
    "\r", "\\r",
    "\t", "\\t",
    "\"", "\\\"",
  )
}


func main() {
  fileName := flag.String("file", "env.js", "The javascript source file to generate")
  varName := flag.String("var", "process.env", "The global variable to be defined")
  envPrefixes := flag.String("prefix", "NX_CUSTOM,VUE_APP,REACT_APP,NODE_ENV", "A comma separated list of prefixes to check environment variable names against")
  writeToStdout := flag.Bool("stdout", false, "Write to stdout instead of file")
  flag.Parse()

  escape := jsonEscape()
  envJson := envVars(strings.Split(*envPrefixes, ","), escape)
  envVar := "\"" + escape.Replace(*varName) + "\""

  var sb strings.Builder
  sb.WriteString("(function(p,c,d){Object.assign(p.split(\".\").reduce(function(c,s){return c[s]||(c[s]={})},c),d)})(")
  sb.WriteString(envVar)
  sb.WriteString(",typeof window!==\"undefined\"?window:typeof global!==\"undefined\"?global:new Function(\"return this\")(),")
  sb.WriteString(envJson)
  sb.WriteString(")")

  if *writeToStdout {
    fmt.Print(sb.String())
  } else {
    file, err := os.Create(*fileName)
    if err != nil {
      panic(err)
    }
    _, err = file.WriteString(sb.String())
    if err != nil {
      panic(err)
    }
  }
}
