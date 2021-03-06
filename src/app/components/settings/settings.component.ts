import { Component, OnInit, NgZone } from "@angular/core";
import { NodeService } from "../../providers/node.service";
import { ToastrService } from "ngx-toastr";
import { UtilsService } from "../../providers/utils.service";
// TODO: Temporary solution.
import * as publicIp from 'public-ip';

@Component({
  selector: "app-home",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"]
})
export class SettingsComponent implements OnInit {
  settings = {
    port: this.node.wsPort,
    controlPort: this.node.controlPort,
    dataPort: this.node.dataPort,
    storageDir: this.node.storageDirectory,
    storageSize: Number(this.node.storageSize),
    sslPrivateKey: this.node.sslPrivateKey,
    sslCrt: this.node.sslCrt,
    sslCrtBundle: this.node.sslCrtBundle,
    natPmp: this.node.natPmp,
    isMinimizeToTray: this.node.isMinimizeToTray
  };

  minValue: number = 104857600;
  maxValue: number;
  isWindows: boolean = this.node.platformName === "win32";
  transformedSize: number;
  units: string;
  settingsChanged: boolean;

  constructor(
    public node: NodeService,
    public utilsService: UtilsService,
    public ngZone: NgZone,
    private toastr: ToastrService
  ) {
    this.node.settingsChanged.subscribe((settingsChanged: boolean) => {
      this.settingsChanged = settingsChanged;

      const transformedBytes = this.utilsService.transformDataAndUnits(Number(this.node.storageSize));
      this.transformedSize = transformedBytes.bytes;
      this.units = transformedBytes.units;
    });

    this.utilsService.DiskChecked.subscribe((freeSpace: number) => {
      ngZone.run(() => {
        // 90% of available storage
        this.maxValue = freeSpace * 0.9;
      })
    });
  }

  ngOnInit() {
    this.utilsService.getFreeSpace(this.node.storageDirectory);
  }

  onSave() {
    if (this.settings.storageSize === -1) {
      this.toastr.error("Not valid storage size");
      return;
    }

    this.node.updateSettings("sockets.ws.port", this.settings.port);
    this.node.updateSettings("sockets.wrtc.control.port", this.settings.controlPort);
    this.node.updateSettings("sockets.wrtc.data.port", this.settings.dataPort);
    this.node.updateSettings("storage.dir", this.settings.storageDir);
    this.node.updateSettings("storage.size", this.settings.storageSize);
    this.node.updateSettings("ssl.privateKeyPath", this.settings.sslPrivateKey);
    this.node.updateSettings("ssl.crtPath", this.settings.sslCrt);
    this.node.updateSettings("natPmp", this.settings.natPmp);
    this.node.updateSettings("ssl.crtBundlePath", this.settings.sslCrtBundle);
    this.node.updateGuiSettings("isMinimizeToTray", this.settings.isMinimizeToTray);
    this.toastr.warning("Please restart application for changes to take effect");
    this.node.enableRestart();
  }

  onRestart() {
    this.node.restart();
  }

  storageChange(bytesTotal) {
    const transformedBytes = this.utilsService.transformDataAndUnits(bytesTotal);
    this.transformedSize = transformedBytes.bytes;
    this.units = transformedBytes.units;
  }

  onUdpPortCheck() {
    publicIp.v4().then(ip => {
      window.require("electron").shell.openExternal(`https://check-host.net/check-udp?host=${ip}:` + (this.settings.dataPort ? this.settings.dataPort : '8058'));
    });
  }

  onTcpPortCheck() {
    publicIp.v4().then(ip => {
      window.require("electron").shell.openExternal(`https://check-host.net/check-tcp?host=${ip}:` + (this.settings.controlPort ? this.settings.controlPort : '8048'));
    });
  }
}
