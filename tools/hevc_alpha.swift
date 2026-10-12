// Usage: swiftc -O tools/hevc_alpha.swift -o hevc_alpha && ./hevc_alpha movie-hevc.mp4 out.mov [bitrate] [width]
// HEVC-with-alpha (640px by default) for Safari/iOS (ffmpeg hevc_videotoolbox alpha output does not decode in AVFoundation).
import Foundation; import AVFoundation; import VideoToolbox
let src = URL(fileURLWithPath: CommandLine.arguments[1]), dst = URL(fileURLWithPath: CommandLine.arguments[2])
let bitrate = Int(CommandLine.arguments.count > 3 ? CommandLine.arguments[3] : "1200000")!
try? FileManager.default.removeItem(at: dst)
let asset = AVURLAsset(url: src)
let track = asset.tracks(withMediaType: .video)[0]
let sz = track.naturalSize.applying(track.preferredTransform)
let want = Int(CommandLine.arguments.count > 4 ? CommandLine.arguments[4] : "640")!
let W = min(want, Int(abs(sz.width)) / 2 * 2), H = Int((abs(sz.height) / abs(sz.width) * Double(W) / 2).rounded()) * 2
let reader = try! AVAssetReader(asset: asset)
let out = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
reader.add(out)
let writer = try! AVAssetWriter(outputURL: dst, fileType: .mov)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.hevcWithAlpha, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoScalingModeKey: AVVideoScalingModeResizeAspect,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: bitrate,
    kVTCompressionPropertyKey_TargetQualityForAlpha as String: 0.6]])
input.expectsMediaDataInRealTime = false
writer.add(input); writer.shouldOptimizeForNetworkUse = true
reader.startReading(); writer.startWriting(); writer.startSession(atSourceTime: .zero)
while true {
  if input.isReadyForMoreMediaData {
    guard let sb = out.copyNextSampleBuffer() else { break }
    input.append(sb)
  } else { usleep(1000) }
}
input.markAsFinished()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }; sem.wait()
if writer.status != .completed { FileHandle.standardError.write("FAIL \(String(describing: writer.error))\n".data(using: .utf8)!); exit(1) }
