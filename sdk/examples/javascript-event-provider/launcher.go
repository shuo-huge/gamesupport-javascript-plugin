// The host currently accepts an EXE entrypoint without command-line arguments.
// This launcher forwards GS-IPC unchanged to the bundled JavaScript runtime.
package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

func main() {
	exe, err := os.Executable()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	bin := filepath.Dir(exe)
	child := exec.Command(filepath.Join(bin, "node.exe"), filepath.Join(bin, "..", "plugin.cjs"))
	child.Stdin, child.Stdout, child.Stderr = os.Stdin, os.Stdout, os.Stderr
	child.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	if err := child.Run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
